import { Module } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { FeedbackController } from "./feedback.controller";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { FeedbackRepository } from "./feedback.repository";

@Module({
  imports: [SupabaseModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository],
  exports: [FeedbackService],
})
export class FeedbackModule {}
