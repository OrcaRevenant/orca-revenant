import { Inject, Injectable } from "@nestjs/common";
import { HistoricalPrice, PriceAbstract } from "../../price.abstract";
import { ConfigType } from "@nestjs/config";
import binanceConfig from "./binance.config";
import { HttpService } from "@nestjs/axios";
import { BinanceClient } from "./binance-client.class";

@Injectable()
export class BinanceService extends PriceAbstract {
    private binanceClient: BinanceClient;

    constructor(
        @Inject(binanceConfig.KEY) private readonly config: ConfigType<
            typeof binanceConfig
        >,
        private readonly httpService: HttpService,
    ) {
        super();
        this.binanceClient = new BinanceClient(this.httpService);
        this.binanceClient.syncServerTime();
    }

    async getAssetHistoricalPrice(
        asset: string,
        from: Date,
        to: Date,
    ): Promise<HistoricalPrice[]> {
        const startTimestamp = from.getTime();
        const endTimestamp = to.getTime();
        const candles = await this.binanceClient.getOhlcv(
            `${asset.toUpperCase()}USDT`,
            `3m`,
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
