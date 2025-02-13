import { Injectable } from "@nestjs/common";
import { MOCK_ASSET_PRICES } from "./mock.constant";
import { HistoricalPrice, PriceAbstract } from "@/price/price.abstract";

@Injectable()
export class MockService implements PriceAbstract {
  private readonly defaultPrice: (typeof MOCK_ASSET_PRICES)[number] = {
    basePrice: 1,
    fluctuationRange: 0.001,
    precision: 4,
  };

  private currentPrices: Record<string, number> = {};

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
    const assetData =
      MOCK_ASSET_PRICES[asset.toLowerCase()] || this.defaultPrice;

    const { basePrice, fluctuationRange, precision } = assetData;
    const fluctuationFactor = this.generateFluctuation(
      asset,
      time.getTime(),
      fluctuationRange,
    );

    const price = basePrice * (1 + fluctuationFactor);
    return Promise.resolve(this.roundToPrecision(price, precision));
  }

  private async getCurrentAssetPrice(asset: string): Promise<number> {
    const assetData =
      MOCK_ASSET_PRICES[asset.toLowerCase()] || this.defaultPrice;

    const { basePrice, fluctuationRange, precision } = assetData;
    const fluctuationFactor = this.generateFluctuation(
      asset,
      Date.now(),
      fluctuationRange,
    );

    const price = basePrice * (1 + fluctuationFactor);
    this.currentPrices[asset.toLowerCase()] = price;
    return Promise.resolve(this.roundToPrecision(price, precision));
  }

  private generateFluctuation(
    asset: string,
    timestamp: number,
    range: number,
  ): number {
    const seed = Math.sin(timestamp) * 10000;
    let result = ((seed % 1) - 0.5) * 2 * range;

    const currentPrice =
      this.currentPrices[asset.toLowerCase()] || this.defaultPrice.basePrice;

    // Increase the price if it has too many negatives
    if (currentPrice < this.defaultPrice.basePrice * 0.5) {
      result = Math.abs(result);
    }

    // Pump the price up heavily if it is close to 0
    if (currentPrice < this.defaultPrice.basePrice * 0.1) {
      result = Math.abs(result) * 10;
    }

    return result;
  }

  private roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }
}
