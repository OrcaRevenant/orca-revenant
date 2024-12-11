import { Injectable } from "@nestjs/common";
import { ConnectionFactory } from "./connection.factory";
import { SupabaseService } from "src/supabase/supabase.service";
import { generateTransactionHash } from "./connection.utils";

@Injectable()
export class ConnectionService {
    constructor(
        private readonly connectionFactory: ConnectionFactory,
        private readonly supabaseService: SupabaseService,
    ) {}

    async syncTransactions(portfolio: any) {
        if (!portfolio) throw Error(`Prtfolio not provided`);

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
            }, { onConflict: "hash" }),
        );

        if (error) {
            console.error("Error inserting transaction:", error.message);
        } else {
            console.log("Transaction inserted successfully");
        }
    }
}
