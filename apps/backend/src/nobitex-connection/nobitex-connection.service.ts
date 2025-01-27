import { Injectable } from "@nestjs/common";
import {
    Asset,
    ConnectionAbstract,
    Health,
    Transaction,
} from "@/connection/connection.abstract";
import { NobitexService } from "./nobitex/nobitex.service";
import { getTransactionTypeFromDescription } from "./nobitex/nobitex.utils";

@Injectable()
export class NobitexConnectionService implements ConnectionAbstract {
    constructor(
        private readonly nobitexService: NobitexService,
    ) {
    }

    async checkHealth(apiKey: string): Promise<Health> {
        const { status } = await this.nobitexService.getProfile(apiKey);
        return status === `ok` ? `active` : `inactive`;
    }

    async getTransactions(apiKey: string): Promise<Transaction[]> {
        const { wallets } = await this.nobitexService.getWallets(apiKey);

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
                id: `${v.id}`,
                amount: Math.abs(+(v.amount || 0)),
                asset: v.currency,
                time: v.created_at,
                type: getTransactionTypeFromDescription(v),
            };
        }).sort((a, b) =>
            new Date(a.time).getTime() - new Date(b.time).getTime()
        );
    }

    async getAssets(apiKey: string): Promise<Asset[]> {
        const data = await this.nobitexService.getWallets(apiKey);

        const wallets = data.wallets;

        return Object.keys(wallets).map((k) => {
            const wallet = wallets[k];
            return {
                symbol: k.toLowerCase(),
                balance: +wallet.balance,
            };
        });
    }
}
