import { Module } from "@nestjs/common";
import { PortfolioGroupService } from "./portfolio-group.service";
import { PortfolioGroupRepository } from "./portfolio-group.repository";
import { PortoflioGroupController } from "./portfolio-group.controller";
import { PortfolioModule } from "../portfolio.module";
import { PriceModule } from "@/price/price.module";
@Module({
  imports: [PortfolioModule, PriceModule],
  providers: [PortfolioGroupService, PortfolioGroupRepository],
  exports: [PortfolioGroupService, PortfolioGroupRepository],
  controllers: [PortoflioGroupController],
})
export class PortfolioGroupModule {}
