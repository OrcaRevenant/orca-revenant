import { forwardRef, Module } from "@nestjs/common";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioRepository } from "./portfolio.repository";
import { PortfolioService } from "./portfolio.service";
import { PortfolioSyncModule } from "@/portfolio/portfolio-sync/portfolio-sync.module";
import { PortfolioEventService } from "./portfolio-event.service";
import { TransactionModule } from "@/transaction/transaction.module";
import { DatabaseModule } from "@/database/database.module";
import { PortfolioAssetModule } from "./portfolio-asset/portfolio-asset.module";
import { PriceModule } from "@/price/price.module";
import { PortfolioItemsOrderRepository } from "./portfolio-group/portfolio-items-order.repository";
import { AiAdvisorModule } from "@/ai-advisor/ai-advisor.module";

@Module({
  imports: [
    DatabaseModule,
    TransactionModule,
    PortfolioAssetModule,
    forwardRef(() => PortfolioSyncModule),
    PriceModule,
    AiAdvisorModule,
  ],
  providers: [
    PortfolioService,
    PortfolioRepository,
    PortfolioEventService,
    PortfolioItemsOrderRepository,
  ],
  controllers: [PortfolioController],
  exports: [PortfolioService, PortfolioEventService, PortfolioRepository],
})
export class PortfolioModule {}
