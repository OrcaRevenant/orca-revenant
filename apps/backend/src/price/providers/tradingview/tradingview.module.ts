import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { TradingViewService } from "./tradingview.service";
import tradingviewConfig from "./tradingview.config";

@Module({
  imports: [ConfigModule.forFeature(tradingviewConfig), HttpModule],
  providers: [{ provide: "PriceProvider", useClass: TradingViewService }],
  exports: ["PriceProvider"],
})
export class TradingViewModule {}
