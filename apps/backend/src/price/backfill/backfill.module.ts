import { forwardRef, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BackfillProcessor } from "./backfill.processor";
import { BackfillService } from "./backfill.service";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { PriceModule } from "../price.module";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { BackfillStatusService } from "./backfill-status.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "backfill",
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
      },
    }),
    BullBoardModule.forFeature({
      name: "backfill",
      adapter: BullMQAdapter,
    }),
    SupabaseModule,
    forwardRef(() => PriceModule),
  ],
  providers: [BackfillProcessor, BackfillService, BackfillStatusService],
  exports: [BackfillService, BackfillStatusService],
})
export class BackfillModule {}
