import { forwardRef, Module } from "@nestjs/common";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioRepository } from "./portfolio.repository";
import { PortfolioService } from "./portfolio.service";
import { PortfolioSyncModule } from "@/portfolio/portfolio-sync/portfolio-sync.module";
import { PortfolioEventService } from "./portfolio-event.service";
import { TransactionModule } from "@/transaction/transaction.module";

@Module({
  imports: [
    SupabaseModule,
    TransactionModule,
    forwardRef(() => PortfolioSyncModule),
  ],
  providers: [
    PortfolioService,
    PortfolioRepository,
    PortfolioEventService,
  ],
  controllers: [PortfolioController],
  exports: [PortfolioService, PortfolioEventService, PortfolioRepository],
})
export class PortfolioModule {}
