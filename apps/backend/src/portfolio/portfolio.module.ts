import { Module } from "@nestjs/common";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioRepository } from "./portfolio.repository";
import { PortfolioService } from "./portfolio.service";
import { ConnectionModule } from "@/connection/connection.module";
import { PortfolioSyncModule } from "@/portfolio-sync/portfolio-sync.module";

@Module({
  imports: [SupabaseModule, ConnectionModule, PortfolioSyncModule],
  providers: [
    PortfolioService,
    PortfolioRepository,
  ],
  controllers: [PortfolioController],
  exports: [PortfolioService],
})
export class PortfolioModule {}
