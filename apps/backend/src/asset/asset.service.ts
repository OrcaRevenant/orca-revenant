import { Injectable } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";
import { Timeframe } from "@/portfolio/portfolio.types";
import { calculateDateRange } from "@/portfolio/portfolio.utils";
import { PriceConversionService } from "@/price/price-conversion.service";

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly priceConversionService: PriceConversionService
  ) {}

  async getAll() {
    return this.assetRepository.findAll();
  }

  async getAssetHistoryStrict(
    symbol: string,
    timeframe: Timeframe,
    quote: string = "usdt"
  ) {
    const { startDate, endDate, resolution } = calculateDateRange(timeframe);
    return this.getAssetHistory(symbol, startDate, endDate, resolution, quote);
  }

  async getAssetPrice(symbol: string, at?: Date) {
    return this.assetRepository.findAssetPrice(symbol, at);
  }

  async getAssetHistory(
    symbol: string,
    startDate: Date,
    endDate: Date,
    resolution: string,
    quote: string = "usdt"
  ) {
    const priceHistory = await this.assetRepository.findAssetPriceHistory(
      symbol,
      startDate,
      endDate,
      resolution
    );

    const convertedPriceHistory =
      await this.priceConversionService.convertPriceHistory(
        priceHistory.map((record) => ({
          time: new Date(record.time),
          price: Number(record.price),
        })),
        quote
      );

    return priceHistory.map((record, index) => ({
      time: record.time,
      price: convertedPriceHistory[index].price.toString(),
    }));
  }
}
