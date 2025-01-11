export type Resolution = string | number;
export type HistoricalPrice = { time: string; price: number; asset: string };

export abstract class PriceAbstract {
    abstract getAssetPrice(
        asset: string,
        timestamp: Date,
    ): Promise<number>;

    abstract getAssetHistoricalPrice(
        asset: string,
        from: Date,
        to: Date,
        resolution: Resolution,
    ): Promise<HistoricalPrice[]>;

    abstract getCurrentAssetPrices(
        assets: string[],
    ): Promise<Record<string, number>>;
}
