import { Module } from "@nestjs/common";
import { PortfolioAssetService } from "./portfolio-asset.service";
import { PortfolioAssetRepository } from "./portfolio-asset.repository";

@Module({
  providers: [PortfolioAssetService, PortfolioAssetRepository],
  exports: [PortfolioAssetService, PortfolioAssetRepository],
})
export class PortfolioAssetModule {}
