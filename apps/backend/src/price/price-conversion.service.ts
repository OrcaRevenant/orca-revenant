import { Inject, Injectable } from "@nestjs/common";
import { PriceRepository } from "./price.repository";
import priceConfig from "./price.config";
import { ConfigType } from "@nestjs/config";

interface PriceWithQuote {
  asset: string;
  price: number;
  quoteAsset?: string; // Add original quote asset
}

@Injectable()
export class PriceConversionService {
  constructor(
    @Inject(priceConfig.KEY)
    private readonly config: ConfigType<typeof priceConfig>,
    private readonly priceRepository: PriceRepository
  ) {}

  /**
   * Converts a price from the default quote asset (USDT) to a different quote asset
   * @param price - The price in the default quote
   * @param targetQuote - The target quote asset to convert to
   * @param timestamp - The timestamp to get the conversion rate for
   * @returns The converted price
   */
  async convertPrice(
    price: number,
    targetQuote: string,
    timestamp?: Date
  ): Promise<number> {
    if (targetQuote.toLowerCase() === this.config.defaultQuote) {
      return price;
    }

    const conversionRate = await this.priceRepository.getConversionRate(
      targetQuote,
      timestamp
    );

    return price / conversionRate;
  }

  /**
   * Converts multiple prices from the default quote to a target quote
   * @param prices - Array of price objects with format { asset: string, price: number }
   * @param targetQuote - The target quote asset to convert to
   * @param timestamp - The timestamp to get the conversion rate for
   * @returns The converted price objects
   */
  async convertPrices(
    prices: PriceWithQuote[],
    targetQuote: string,
    timestamp?: Date
  ) {
    if (targetQuote.toLowerCase() === this.config.defaultQuote) {
      return prices;
    }

    const conversionRate = await this.priceRepository.getConversionRate(
      targetQuote,
      timestamp
    );

    return prices.map((item) => {
      // If the price is already in the target quote, return as-is
      if (item.quoteAsset?.toLowerCase() === targetQuote.toLowerCase()) {
        return item;
      }

      return {
        asset: item.asset,
        price: item.price / conversionRate,
        quoteAsset: targetQuote,
      };
    });
  }

  /**
   * Converts historical price data from the default quote to a target quote
   * @param priceHistory - Array of historical price data with format { time: Date, price: number }
   * @param targetQuote - The target quote asset to convert to
   * @returns The converted price history
   */
  async convertPriceHistory(
    priceHistory: { time: Date; price: number }[],
    targetQuote: string
  ): Promise<{ time: Date; price: number }[]> {
    if (targetQuote.toLowerCase() === this.config.defaultQuote) {
      return priceHistory; // No conversion needed
    }

    // Group by time to reduce DB queries
    const timeGroups = this.groupByTime(priceHistory);
    const timeKeys = Object.keys(timeGroups);

    // For each unique timestamp, get the conversion rate
    const conversionRates = await Promise.all(
      timeKeys.map(async (timeStr) => {
        const time = new Date(timeStr);
        const rate = await this.priceRepository.getConversionRate(
          targetQuote,
          time
        );
        return { time: timeStr, rate };
      })
    );

    // Create a map for quick lookups
    const rateMap = conversionRates.reduce(
      (acc, item) => {
        acc[item.time] = item.rate;
        return acc;
      },
      {} as Record<string, number>
    );

    // Convert all prices
    return priceHistory.map((item) => {
      const timeStr = item.time.toISOString();
      const rate = rateMap[timeStr] || 1;
      return {
        time: item.time,
        price: item.price / rate,
      };
    });
  }

  /**
   * Groups price history entries by their timestamp
   * @param priceHistory - Array of price history data
   * @returns An object with timestamps as keys and arrays of prices as values
   */
  private groupByTime(
    priceHistory: { time: Date; price: number }[]
  ): Record<string, { time: Date; price: number }[]> {
    return priceHistory.reduce(
      (acc, item) => {
        const timeStr = item.time.toISOString();
        if (!acc[timeStr]) {
          acc[timeStr] = [];
        }
        acc[timeStr].push(item);
        return acc;
      },
      {} as Record<string, { time: Date; price: number }[]>
    );
  }

  /**
   * Gets the conversion rate from the default quote (USDT) to the target quote
   * @param targetQuote - The target quote asset
   * @param timestamp - Optional timestamp for historical rates
   * @returns The conversion rate
   */
  async getConversionRate(
    targetQuote: string,
    timestamp?: Date
  ): Promise<number> {
    if (targetQuote.toLowerCase() === this.config.defaultQuote) {
      return 1;
    }

    return this.priceRepository.getConversionRate(targetQuote, timestamp);
  }
}
