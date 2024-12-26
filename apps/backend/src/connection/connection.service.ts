import { Injectable } from "@nestjs/common";
import { ConnectionFactory } from "./connection.factory";
import { SupabaseService } from "@/common/supabase/supabase.service";
import { generateTransactionHash } from "./connection.utils";
import { Database } from "@orca/types";
import { UniqueIdentifier } from "./connection.abstract";
import { isAxiosError } from "axios";
import { HttpStatusCode } from "axios";
import { PortfolioValue } from "./connection.types";

@Injectable()
export class ConnectionService {
    constructor(
        private readonly connectionFactory: ConnectionFactory,
        private readonly supabaseService: SupabaseService,
    ) {}

    private async updatePortfolio(
        id: UniqueIdentifier,
        portfolio: Partial<Database[`public`][`Tables`][`portfolio`][`Row`]>,
    ) {
        return this.supabaseService
            .getClient()
            .from("portfolio")
            .update({
                ...portfolio,
                last_sync_at: new Date().toISOString(),
            })
            .eq("id", id);
    }

    async syncPortfolioAssets(
        portfolio: Database[`public`][`Tables`][`portfolio`][`Row`],
    ) {
        const transactions = await this.supabaseService.getClient().from(
            `transaction`,
        ).select(`*`).eq(`portfolio_id`, portfolio.id);

        const assets = await this.calculatePortfolioValues(
            transactions.data,
        );

        const assetsToInsert = assets.map((v) => {
            return {
                asset: v.asset,
                amount: v.balance,
                portfolio_id: portfolio.id,
            };
        });

        await this.supabaseService.getClient().from(
            `portfolio_assets`,
        ).upsert(
            assetsToInsert,
            { onConflict: `asset, portfolio_id` },
        );
    }

    async syncTransactions(
        portfolio: Database[`public`][`Tables`][`portfolio`][`Row`],
    ) {
        if (!portfolio) throw Error(`Prtfolio not provided`);

        try {
            const connection = this.connectionFactory.getConnection(
                portfolio.connection_name,
            );
            const transactions = await connection.getTransactions(
                portfolio.api_key,
            );

            const { error } = await this.supabaseService.getClient().from(
                `transaction`,
            ).upsert(
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
                { onConflict: `hash` },
            );

            if (error) throw error;

            await this.updatePortfolio(portfolio.id, { status: `active` });

            console.log("Transaction inserted successfully");
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.status === HttpStatusCode.Unauthorized) {
                    await this.updatePortfolio(portfolio.id, {
                        status: `inactive`,
                    });
                }
            }

            console.error("Error inserting transaction:", error.message);
        }
    }

    private async calculatePortfolioValues(
        transactions: Database["public"]["Tables"]["transaction"]["Row"][],
    ): Promise<PortfolioValue[]> {
        const assetBalances: Record<string, number> = {};

        transactions.forEach((transaction) => {
            const { asset, amount, fee, type } = transaction;

            if (!assetBalances[asset]) {
                assetBalances[asset] = 0;
            }

            let netChange = 0;

            switch (type) {
                case "deposit":
                    netChange = amount;
                    break;
                case "withdrawal":
                    netChange = -amount;
                    break;
                case "buy":
                    netChange = amount;
                    break;
                case "sell":
                    netChange = -amount;
                    break;
                default:
                    netChange = 0;
            }

            netChange -= fee || 0;
            assetBalances[asset] += netChange;
        });

        const portfolioValues: PortfolioValue[] = Object.entries(assetBalances)
            .map(
                ([asset, totalBalance]) => ({
                    asset,
                    balance: totalBalance < 0
                        ? 0
                        : parseFloat(totalBalance.toFixed(8)),
                }),
            );

        return portfolioValues;
    }
}
