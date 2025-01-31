import { AssetRepository } from "@/asset/asset.repository";
import { Asset } from "@/asset/asset.types";
import { ConnectionFactory } from "@/connection/connection.factory";
import { PortfolioEventService } from "@/portfolio/portfolio-event.service";
import { PortfolioRepository } from "@/portfolio/portfolio.repository";
import { Portfolio, PortfolioStatus } from "@/portfolio/portfolio.types";
import { TransactionRepository } from "@/transaction/transaction.repository";
import { generateTransactionHash } from "@/transaction/transaction.utils";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Queue } from "bullmq";

@Injectable()
export class PortfolioSyncService {
    constructor(
        private readonly connectionFactory: ConnectionFactory,
        private readonly transactionRepository: TransactionRepository,
        private readonly portfolioRepository: PortfolioRepository,
        private readonly assetRepository: AssetRepository,
        private readonly portfolioEventService: PortfolioEventService,
        @InjectQueue("portfolio-sync") private readonly queue: Queue,
    ) {}

    @OnEvent("backfill.completed")
    async onPriceBackfillCompleted() {
        this.syncInitialPortfolios();
    }

    async enqueueSyncJob(portfolio: Portfolio) {
        await this.queue.add(`sync-portfolio-${portfolio.id}`, portfolio, {
            attempts: 3,
            backoff: 5000,
        });
    }

    async sync(portfolio: Portfolio) {
        if (!portfolio) throw Error(`Prtfolio not provided`);

        await this.updateStatusAndSendEvent(portfolio, `syncing`);

        const supportedAssets = await this.assetRepository.findAll();

        try {
            await Promise.all([
                this.syncPortfolioAssets(portfolio, supportedAssets),
                this.syncTransactions(portfolio, supportedAssets),
            ]);

            await this.updateStatusAndSendEvent(portfolio, `active`);
        } catch (error) {
            await this.updateStatusAndSendEvent(portfolio, `inactive`);
            console.error("Error syncing portfolio:", error.message);
        }
    }

    async updateStatusAndSendEvent(
        portfolio: Portfolio,
        status: PortfolioStatus,
    ) {
        await this.portfolioRepository.updateStatusById(
            portfolio,
            status,
        );

        this.portfolioEventService.sendEvent(
            {
                portfolioId: `${portfolio.id}`,
                userId: portfolio.user_id,
                status,
            },
        );
    }

    private async syncPortfolioAssets(
        portfolio: Portfolio,
        supportedAssets: Asset[],
    ) {
        const connection = this.connectionFactory.getConnection(
            portfolio.connection_name,
        );

        const assets = await connection.getAssets(portfolio.api_key);

        const supportedSymbols = new Set(
            supportedAssets.flatMap((
                asset,
            ) => [asset.symbol, ...(asset.alt_names || [])]),
        );

        const assetsToInsert = assets
            .filter((v) => supportedSymbols.has(v.symbol))
            .map((v) => ({
                asset: v.symbol,
                amount: v.balance,
                portfolio_id: portfolio.id,
            }));

        if (assetsToInsert.length > 0) {
            await this.portfolioRepository.insertAssets(
                assetsToInsert,
            );
            console.log(
                `Assets inserted successfully (${assetsToInsert.length} records)`,
            );
        } else {
            console.log("No supported assets to insert");
        }
    }

    private async syncTransactions(
        portfolio: Portfolio,
        supportedAssets: Asset[],
    ) {
        const connection = this.connectionFactory.getConnection(
            portfolio.connection_name,
        );

        const transactions = await connection.getTransactions(
            portfolio.api_key,
        );

        const supportedSymbols = new Set(
            supportedAssets.flatMap((asset) => [
                asset.symbol,
                ...(asset.alt_names || []),
            ]),
        );

        const transactionsToInsert = transactions
            .filter((v) => {
                return supportedSymbols.has(v.asset.toLowerCase());
            })
            .map((v) => ({
                amount: v.amount,
                asset: v.asset,
                time: v.time,
                type: v.type,
                portfolio_id: portfolio.id,
                hash: generateTransactionHash(v.id),
            }));

        // Insert transactions into the database
        if (transactionsToInsert.length > 0) {
            await this.transactionRepository.insertMany(transactionsToInsert);
            console.log(
                `Transactions inserted successfully (${transactionsToInsert.length} records)`,
            );
        } else {
            console.log("No supported transactions to insert");
        }
    }

    private async syncInitialPortfolios(syncThresholdMinutes: number = 60) {
        const portfolios = await this.portfolioRepository
            .findUnsynced(syncThresholdMinutes);
        // const portfolios = await this.portfolioRepospitory
        //     .findAll();

        if (portfolios.length > 0) {
            console.log(
                `Syncing ${portfolios.length} portfolios...`,
            );
        } else {
            console.log(`No portfolios to sync`);
        }

        await Promise.all(
            portfolios.map(async (portfolio) => {
                try {
                    await this.enqueueSyncJob(portfolio);
                } catch (error) {
                    console.error(
                        `Error processing portfolio ${portfolio.id}:`,
                        error,
                    );
                }
            }),
        );
    }
}
