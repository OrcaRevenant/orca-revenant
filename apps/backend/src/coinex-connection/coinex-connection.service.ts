import { Injectable } from "@nestjs/common";
import {
    Asset,
    ConnectionAbstract,
    Health,
    Transaction,
} from "@/connection/connection.abstract";
import { CoinexService } from "./coinex/coinex.service";
import { Meta as CoinexMeta } from "./coinex-connection.types";
import { createUniqueId, digestType } from "./coinex/coinex.utils";

@Injectable()
export class CoinexConnectionService implements ConnectionAbstract {
    constructor(
        private readonly coinexService: CoinexService,
    ) {
    }

    async checkHealth(meta: CoinexMeta): Promise<Health> {
        const response = await this.coinexService.getAccountInfo(
            meta.api_key,
            meta.secret_key,
        );

        return !!response.data.user_id ? "active" : "inactive";
    }

    async getTransactions(meta: CoinexMeta): Promise<Transaction[]> {
        const [trades, deposit, withdraw] = await Promise.all([
            this.coinexService.getSpotTransactions(
                meta.api_key,
                meta.secret_key,
                "trade",
            ),
            this.coinexService.getSpotTransactions(
                meta.api_key,
                meta.secret_key,
                "deposit",
            ),
            this.coinexService.getSpotTransactions(
                meta.api_key,
                meta.secret_key,
                "withdraw",
            ),
        ]);

        return [...trades, ...deposit, ...withdraw].map((v) => ({
            id: createUniqueId(v),
            amount: Math.abs(parseFloat(v.change)),
            asset: v.ccy.toLowerCase(),
            time: new Date(v.created_at).toISOString(),
            type: digestType(v),
        }));
    }

    async getAssets(meta: CoinexMeta): Promise<Asset[]> {
        const response = await this.coinexService.getSpotBalance(
            meta.api_key,
            meta.secret_key,
        );

        return response.data.map((v) => ({
            balance: +v.available,
            symbol: v.ccy.toLowerCase(),
        }));
    }
}
