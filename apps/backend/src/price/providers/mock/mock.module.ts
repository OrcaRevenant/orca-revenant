import { Module } from "@nestjs/common";
import { MockService } from "./mock.service";
import { PRICE_PROVIDER } from "../price-provider.constant";
import { ConfigModule } from "@nestjs/config";
import mockConfig from "./mock.config";

@Module({
  imports: [ConfigModule.forFeature(mockConfig)],
  providers: [{ provide: PRICE_PROVIDER, useClass: MockService }],
  exports: [PRICE_PROVIDER],
})
export class MockModule {}
