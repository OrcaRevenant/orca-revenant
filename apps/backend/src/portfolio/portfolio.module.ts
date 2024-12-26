import { Module } from "@nestjs/common";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioRepository } from "./portfolio.repository";
import { PortfolioService } from "./portfolio.service";

@Module({
  imports: [SupabaseModule],
  providers: [PortfolioService, PortfolioRepository],
  controllers: [PortfolioController],
  exports: [PortfolioService],
})
export class PortfolioModule {}
