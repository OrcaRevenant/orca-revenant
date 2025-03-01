export type Resolution = number;
export type HistoricalPrice = { time: string; price: number; asset: string };

export abstract class PriceAbstract {
  abstract getAssetHistoricalPrice(
    asset: string,
    from: Date,
    to: Date,
    resolution: Resolution,
  ): Promise<HistoricalPrice[]>;
}
