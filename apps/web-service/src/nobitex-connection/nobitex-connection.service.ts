import { Injectable } from "@nestjs/common";
import {
    Asset,
    ConnectionAbstract,
    Transaction,
} from "src/connection/connection.abstract";
import { SupabaseService } from "src/supabase/supabase.service";
import { NobitexService } from "./nobitex/nobitex.service";
import { getTransactionTypeFromDescription } from "./nobitex/nobitex.utils";

// 87b43f761d0703ce217ade970887a2e0623a2d0d
@Injectable()
export class NobitexConnectionService implements ConnectionAbstract {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly nobitexService: NobitexService,
    ) {
    }

    async getTransactions(apiKey: string): Promise<Transaction[]> {
        const { wallets } = await this.nobitexService.getWallets(apiKey);

        // const walletIds = [22150094];
        const walletIds = Object.keys(wallets).map((v) => wallets[v].id);

        const userTransactionsPromises = walletIds.map((walletId) =>
            this.nobitexService.getTransactions(apiKey, walletId)
        );

        const userTransactionsResponses = await Promise.all(
            userTransactionsPromises,
        );

        const allUserTransactions = userTransactionsResponses.flat();

        return allUserTransactions.map((v) => {
            return {
                amount: Math.abs(+(v.amount || 0)),
                fee: +(v.calculatedFee || 0),
                asset: v.currency,
                time: v.created_at,
                type: getTransactionTypeFromDescription(v),
                portfolio_id: 1,
            };
        }).sort((a, b) =>
            new Date(a.time).getTime() - new Date(b.time).getTime()
        );
    }

    async getAssets(apiKey: string): Promise<Asset[]> {
        const data = await this.nobitexService.getAvailableAssets(apiKey);

        const activeCurrencyList = data.nobitex.activeCurrencies;

        return activeCurrencyList.map((v) => {
            return {
                symbol: v,
            };
        });
    }
}
