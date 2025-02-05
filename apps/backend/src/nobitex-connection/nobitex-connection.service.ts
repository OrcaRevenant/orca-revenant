import { Injectable } from "@nestjs/common";
import {
    Asset,
    ConnectionAbstract,
    Health,
    Transaction,
} from "@/connection/connection.abstract";
import { NobitexService } from "./nobitex/nobitex.service";
import { getTransactionTypeFromDescription } from "./nobitex/nobitex.utils";
import { NobitexMeta } from "./nobitex-connection.types";

@Injectable()
export class NobitexConnectionService implements ConnectionAbstract {
    constructor(
        private readonly nobitexService: NobitexService,
    ) {
    }

    async checkHealth(meta: NobitexMeta): Promise<Health> {
        const { status } = await this.nobitexService.getProfile(meta.api_key);
        return status === `ok` ? `active` : `inactive`;
    }

    async getTransactions(meta: NobitexMeta): Promise<Transaction[]> {
        const { wallets } = await this.nobitexService.getWallets(meta.api_key);

        const walletIds = Object.keys(wallets).map((v) => wallets[v].id);

        const userTransactionsPromises = walletIds.map((walletId) =>
            this.nobitexService.getTransactions(meta.api_key, walletId)
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
        });
    }

    async getAssets(meta: NobitexMeta): Promise<Asset[]> {
        const data = await this.nobitexService.getWallets(meta.api_key);

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
