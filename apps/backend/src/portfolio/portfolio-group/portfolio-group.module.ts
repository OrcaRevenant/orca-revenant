import { Module } from "@nestjs/common";
import { PortfolioGroupService } from "./portfolio-group.service";
import { PortfolioGroupRepository } from "./portfolio-group.repository";
import { PortoflioGroupController } from "./portfolio-group.controller";
import { PortfolioModule } from "../portfolio.module";

@Module({
  imports: [PortfolioModule],
  providers: [PortfolioGroupService, PortfolioGroupRepository],
  exports: [PortfolioGroupService, PortfolioGroupRepository],
  controllers: [PortoflioGroupController],
})
export class PortfolioGroupModule {}
