import { Module } from "@nestjs/common";
import { PortfolioSyncService } from "./portfolio-sync.service";
import { PortfolioRepository } from "@/portfolio/portfolio.repository";
import { TransactionRepository } from "@/transaction/transaction.repository";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { ConnectionModule } from "@/connection/connection.module";
import { BullModule } from "@nestjs/bullmq";
import { PortfolioSyncProcessor } from "./portfolio-sync.processor";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "portfolio-sync",
    }),
    BullBoardModule.forFeature({
      name: "portfolio-sync",
      adapter: BullMQAdapter,
    }),
    SupabaseModule,
    ConnectionModule,
  ],
  providers: [
    PortfolioSyncService,
    PortfolioRepository,
    TransactionRepository,
    PortfolioSyncProcessor,
  ],
  exports: [PortfolioSyncService],
})
export class PortfolioSyncModule {}
