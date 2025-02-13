import { Module } from "@nestjs/common";
import { AlphaVantageService } from "./alpha-ventage.service";
import alphaVentageConfig from "./alpha-ventage.config";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [ConfigModule.forFeature(alphaVentageConfig), HttpModule],
  providers: [{ provide: "PriceProvider", useClass: AlphaVantageService }],
  exports: ["PriceProvider"],
})
export class AlphaVantageModule {}
