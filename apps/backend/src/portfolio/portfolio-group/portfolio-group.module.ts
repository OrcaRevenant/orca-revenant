import { Module } from "@nestjs/common";
import { PortfolioGroupService } from "./portfolio-group.service";
import { PortfolioGroupRepository } from "./portfolio-group.repository";

@Module({
  providers: [PortfolioGroupService, PortfolioGroupRepository],
  exports: [PortfolioGroupService, PortfolioGroupRepository],
})
export class PortfolioGroupModule {}
