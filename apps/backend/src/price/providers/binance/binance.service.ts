import { Inject, Injectable } from "@nestjs/common";
import { HistoricalPrice } from "../../price.abstract";
import { ConfigType } from "@nestjs/config";
import binanceConfig from "./binance.config";
import { HttpService } from "@nestjs/axios";
import { BinanceClient } from "./binance-client.class";
import { PriceProviderAbstract } from "../price-provider.abstract";

@Injectable()
export class BinanceService extends PriceProviderAbstract {
    private binanceClient: BinanceClient;

    constructor(
        @Inject(binanceConfig.KEY) protected readonly config: ConfigType<
            typeof binanceConfig
        >,
        private readonly httpService: HttpService,
    ) {
        super(config);

        this.binanceClient = new BinanceClient(this.httpService);
        this.binanceClient.syncServerTime();
    }

    async getHistoricalPrice(
        asset: string,
        from: Date,
        to: Date,
        // resolution: Resolution,
    ): Promise<HistoricalPrice[]> {
        const startTimestamp = from.getTime();
        const endTimestamp = to.getTime();
        const candles = await this.binanceClient.getOhlcv(
            `${asset.toUpperCase()}USDT`,
            `5m`,
            startTimestamp,
            endTimestamp,
        );
        const historicalPrices: HistoricalPrice[] = candles.map((
            candle,
        ) => ({
            time: new Date(candle[0]).toISOString(),
            price: parseFloat(candle[4]),
            asset,
        }));

        return historicalPrices;
    }
}
