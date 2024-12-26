export abstract class PriceAbstract {
    abstract getAssetPriceAtTime(
        asset: string,
        time: Date,
    ): Promise<number>;
    abstract getCurrentAssetPrice(asset: string): Promise<number>;

    abstract getAssetsPriceAtTime(
        assets: string[],
        time: Date,
    ): Promise<Record<string, number>>;

    abstract getCurrentAssetsPrice(
        assets: string[],
    ): Promise<Record<string, number>>;
}
