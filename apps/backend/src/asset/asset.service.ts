import { Injectable } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";

@Injectable()
export class AssetService {
    constructor(private readonly assetRepository: AssetRepository) {}

    async findAll() {
        return this.assetRepository.findAll();
    }

    async getAssetHistory(
        symbol: string,
        startDate: Date,
        endDate: Date,
        resolution: "hourly" | "daily",
    ) {
        return this.assetRepository.findAssetPriceHistory(
            symbol,
            startDate,
            endDate,
            resolution,
        );
    }
}
