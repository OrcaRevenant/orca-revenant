import { forwardRef, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MockModule } from "../mock/mock.module";
import { BackfillProcessor } from "./backfill.processor";
import { BackfillService } from "./backfill.service";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { PriceModule } from "../price.module";
import { SupabaseModule } from "@/common/supabase/supabase.module";

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
    MockModule,
    SupabaseModule,
    forwardRef(() => PriceModule),
  ],
  providers: [BackfillProcessor, BackfillService],
  exports: [BackfillService],
})
export class BackfillModule {}
