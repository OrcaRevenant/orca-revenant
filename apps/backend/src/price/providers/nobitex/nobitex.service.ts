import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { HistoricalPrice } from "../../price.abstract";
import nobitexConfig from "./nobitex.config";
import { PriceProviderAbstract } from "../price-provider.abstract";
import { NobitexClient } from "./nobitex-client.class";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class NobitexService extends PriceProviderAbstract {
    private readonly client: NobitexClient;
    constructor(
        @Inject(nobitexConfig.KEY) protected readonly config: ConfigType<
            typeof nobitexConfig
        >,
        private readonly httpService: HttpService,
    ) {
        super(config);

        this.client = new NobitexClient(this.httpService, config);
    }

    async getHistoricalPrice(
        asset: string,
        from: Date,
        to: Date,
    ): Promise<HistoricalPrice[]> {
        const candles = await this.client.fetchAllCandles(
            `${asset.toUpperCase()}USDT`,
            `60`,
            from.getTime() / 1000,
            to.getTime() / 1000,
        );

        return candles.map((candle) => ({
            time: new Date(candle.timestamp * 1000).toISOString(),
            price: candle.close,
            asset: asset,
        }));
    }
}
