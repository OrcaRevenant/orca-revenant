import { Injectable } from "@nestjs/common";
import { PriceAbstract } from "../price.abstract";
import { MOCK_ASSET_PRICES } from "./mock.constant";

@Injectable()
export class MockService implements PriceAbstract {
    private readonly defaultPrice: typeof MOCK_ASSET_PRICES[number] = {
        basePrice: 1,
        fluctuationRange: 0.001,
        precision: 4,
    };

    async getAssetPriceAtTime(
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

    async getCurrentAssetPrice(asset: string): Promise<number> {
        const assetData = MOCK_ASSET_PRICES[asset.toLowerCase()] ||
            this.defaultPrice;

        const { basePrice, fluctuationRange, precision } = assetData;
        const fluctuationFactor = (Math.random() * 2 - 1) * fluctuationRange;

        const price = basePrice * (1 + fluctuationFactor);
        return Promise.resolve(this.roundToPrecision(price, precision));
    }

    async getAssetsPriceAtTime(
        assets: string[],
        time: Date,
    ): Promise<Record<string, number>> {
        const prices: Record<string, number> = {};

        for (const asset of assets) {
            prices[asset] = await this.getAssetPriceAtTime(asset, time);
        }

        return prices;
    }

    async getCurrentAssetsPrice(
        assets: string[],
    ): Promise<Record<string, number>> {
        const prices: Record<string, number> = {};

        for (const asset of assets) {
            prices[asset] = await this.getCurrentAssetPrice(asset);
        }

        return prices;
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
