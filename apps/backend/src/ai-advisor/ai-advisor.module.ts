import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiAdvisorService } from "./ai-advisor.service";
import aiAdvisorConfig from "./ai-advisor.config";

@Module({
  imports: [ConfigModule.forFeature(aiAdvisorConfig)],
  providers: [AiAdvisorService],
  exports: [AiAdvisorService],
})
export class AiAdvisorModule {}
