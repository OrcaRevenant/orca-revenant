import { Injectable } from "@nestjs/common";
import { ConnectionFactory } from "./connection.factory";
import { SupabaseService } from "@/supabase/supabase.service";
import { generateTransactionHash } from "./connection.utils";
import { Database } from "@orca/types";
import { UniqueIdentifier } from "./connection.abstract";
import { isAxiosError } from "axios";
import { HttpStatusCode } from "axios";

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
                    const tx = { ...v, portfolio_id: portfolio.id };
                    return ({
                        ...tx,
                        hash: generateTransactionHash(tx),
                    });
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
}
