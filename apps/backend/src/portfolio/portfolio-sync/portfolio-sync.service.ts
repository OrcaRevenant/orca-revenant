import { ConnectionFactory } from "@/connection/connection.factory";
import { PortfolioEventService } from "@/portfolio/portfolio-event.service";
import { PortfolioRepository } from "@/portfolio/portfolio.repository";
import { Portfolio } from "@/portfolio/portfolio.types";
import { TransactionRepository } from "@/transaction/transaction.repository";
import { generateTransactionHash } from "@/transaction/transaction.utils";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { HttpStatusCode, isAxiosError } from "axios";
import { Queue } from "bullmq";

@Injectable()
export class PortfolioSyncService implements OnModuleInit {
    constructor(
        private readonly connectionFactory: ConnectionFactory,
        private readonly transactionRepository: TransactionRepository,
        private readonly portfolioRepository: PortfolioRepository,
        private readonly portfolioEventService: PortfolioEventService,
        @InjectQueue("portfolio-sync") private readonly queue: Queue,
    ) {}

    onModuleInit() {
        this.syncInitialPortfolios();
    }

    private async syncInitialPortfolios(syncThresholdMinutes: number = 5) {
        const portfolios = await this.portfolioRepository
            .findUnsyncedPortfolios(syncThresholdMinutes);

        await Promise.all(
            portfolios.map(async (portfolio) => {
                try {
                    await this.enqueueSyncJob(portfolio);
                    return { portfolio, synced: true };
                } catch (error) {
                    console.error(
                        `Error processing portfolio ${portfolio.id}:`,
                        error,
                    );
                    return { portfolio, error };
                }
            }),
        );

        console.log(
            `Processed portfolios: Synced ${portfolios.length}`,
        );
    }

    async enqueueSyncJob(portfolio: Portfolio) {
        await this.queue.add("sync-portfolio", portfolio);
    }

    async syncTransactions(
        portfolio: Portfolio,
    ) {
        if (!portfolio) throw Error(`Prtfolio not provided`);

        try {
            const connection = this.connectionFactory.getConnection(
                portfolio.connection_name,
            );
            const transactions = await connection.getTransactions(
                portfolio.api_key,
            );

            this.transactionRepository.createMany(
                transactions.map((v) => {
                    return {
                        amount: v.amount,
                        asset: v.asset,
                        fee: v.fee,
                        time: v.time,
                        type: v.type,
                        portfolio_id: portfolio.id,
                        hash: generateTransactionHash(v.id),
                    };
                }),
            );

            await this.portfolioRepository.updateStatus(
                portfolio,
                `active`,
            );

            this.portfolioEventService.sendEvent(
                {
                    portfolioId: `${portfolio.id}`,
                    userId: portfolio.user_id,
                    status: `active`,
                },
            );

            console.log("Transaction inserted successfully");
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.status === HttpStatusCode.Unauthorized) {
                    await this.portfolioRepository.updateStatus(
                        portfolio,
                        `inactive`,
                    );
                }

                this.portfolioEventService.sendEvent(
                    {
                        portfolioId: `${portfolio.id}`,
                        userId: portfolio.user_id,
                        status: `inactive`,
                    },
                );
            }

            console.error("Error inserting transaction:", error.message);
        }
    }
}
