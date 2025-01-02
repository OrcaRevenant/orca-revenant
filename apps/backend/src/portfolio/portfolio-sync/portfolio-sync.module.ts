import { forwardRef, Module } from "@nestjs/common";
import { PortfolioSyncService } from "./portfolio-sync.service";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { ConnectionModule } from "@/connection/connection.module";
import { BullModule } from "@nestjs/bullmq";
import { PortfolioSyncProcessor } from "./portfolio-sync.processor";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { TransactionModule } from "@/transaction/transaction.module";
import { PortfolioModule } from "@/portfolio/portfolio.module";

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
    TransactionModule,
    forwardRef(() => PortfolioModule),
  ],
  providers: [
    PortfolioSyncService,
    PortfolioSyncProcessor,
  ],
  exports: [PortfolioSyncService],
})
export class PortfolioSyncModule {}
