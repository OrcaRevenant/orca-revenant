import { Injectable } from "@nestjs/common";
import { HistoricalPrice, PriceAbstract } from "../price.abstract";
import { MOCK_ASSET_PRICES } from "./mock.constant";

@Injectable()
export class MockService implements PriceAbstract {
    private readonly defaultPrice: typeof MOCK_ASSET_PRICES[number] = {
        basePrice: 1,
        fluctuationRange: 0.001,
        precision: 4,
    };

    async getAssetPrice(asset: string, timestamp: Date): Promise<number> {
        return this.getAssetPriceAtTime(asset, timestamp);
    }

    async getAssetHistoricalPrice(
        asset: string,
        from: Date,
        to: Date,
        resolution: number,
    ): Promise<HistoricalPrice[]> {
        const prices: HistoricalPrice[] = [];

        let currentTime = new Date(from).getTime();
        const toTime = new Date(to).getTime();

        while (currentTime <= toTime) {
            const price = await this.getAssetPriceAtTime(
                asset,
                new Date(currentTime),
            );
            prices.push({
                time: new Date(currentTime).toISOString(),
                price,
                asset,
            });
            currentTime += resolution * 60 * 1000;
        }

        return prices;
    }

    async getCurrentAssetPrices(
        assets: string[],
    ): Promise<Record<string, number>> {
        const prices: Record<string, number> = {};

        for (const asset of assets) {
            prices[asset] = await this.getCurrentAssetPrice(asset);
        }

        return prices;
    }

    private async getAssetPriceAtTime(
        asset: string,
        time: Date,
    ): Promise<number> {
        const assetData = MOCK_ASSET_PRICES[asset.toLowerCase()] ||
            this.defaultPrice;

        const { basePrice, fluctuationRange, precision } = assetData;
        const fluctuationFactor = this.generateFluctuation(
            time.getTime(),
            fluctuationRange,
        );

        const price = basePrice * (1 + fluctuationFactor);
        return Promise.resolve(this.roundToPrecision(price, precision));
    }

    private async getCurrentAssetPrice(asset: string): Promise<number> {
        const assetData = MOCK_ASSET_PRICES[asset.toLowerCase()] ||
            this.defaultPrice;

        const { basePrice, fluctuationRange, precision } = assetData;
        const fluctuationFactor = (Math.random() * 2 - 1) * fluctuationRange;

        const price = basePrice * (1 + fluctuationFactor);
        return Promise.resolve(this.roundToPrecision(price, precision));
    }

    private generateFluctuation(timestamp: number, range: number): number {
        const seed = Math.sin(timestamp) * 10000;
        return ((seed % 1) - 0.5) * 2 * range;
    }

    private roundToPrecision(value: number, precision: number): number {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    }
}
