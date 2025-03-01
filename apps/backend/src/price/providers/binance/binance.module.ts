import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import binanceConfig from "./binance.config";
import { BinanceService } from "./binance.service";

@Module({
    imports: [ConfigModule.forFeature(binanceConfig), HttpModule],
    providers: [{ provide: "PriceProvider", useClass: BinanceService }],
    exports: ["PriceProvider"],
})
export class BinanceModule {}
