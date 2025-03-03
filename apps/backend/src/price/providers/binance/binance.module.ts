import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import binanceConfig from "./binance.config";
import { BinanceService } from "./binance.service";
import { PRICE_PROVIDER } from "../price-provider.constant";

@Module({
    imports: [ConfigModule.forFeature(binanceConfig), HttpModule],
    providers: [{ provide: PRICE_PROVIDER, useClass: BinanceService }],
    exports: [PRICE_PROVIDER],
})
export class BinanceModule {}
