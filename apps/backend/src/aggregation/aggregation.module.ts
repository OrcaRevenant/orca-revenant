import { Module } from "@nestjs/common";
import { AggregationController } from "./aggregation.controller";
import { AggregationService } from "./aggregation.service";
import { PortfolioModule } from "@/portfolio/portfolio.module";
import { PortfolioGroupModule } from "@/portfolio/portfolio-group/portfolio-group.module";

@Module({
  imports: [PortfolioModule, PortfolioGroupModule],
  controllers: [AggregationController],
  providers: [AggregationService],
})
export class AggregationModule {}
