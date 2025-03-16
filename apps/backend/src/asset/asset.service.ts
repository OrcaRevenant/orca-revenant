import { Injectable } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";
import { Timeframe } from "@/portfolio/portfolio.types";
import { calculateDateRange } from "@/portfolio/portfolio.utils";

@Injectable()
export class AssetService {
  constructor(private readonly assetRepository: AssetRepository) {}

  async getAll() {
    return this.assetRepository.findAll();
  }

  async getAssetHistoryStrict(symbol: string, timeframe: Timeframe) {
    const { startDate, endDate, resolution } = calculateDateRange(timeframe);
    return this.getAssetHistory(symbol, startDate, endDate, resolution);
  }

  async getAssetHistory(
    symbol: string,
    startDate: Date,
    endDate: Date,
    resolution: string
  ) {
    return this.assetRepository.findAssetPriceHistory(
      symbol,
      startDate,
      endDate,
      resolution
    );
  }
}
