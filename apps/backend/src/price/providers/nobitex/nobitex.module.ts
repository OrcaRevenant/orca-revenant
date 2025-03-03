import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { PRICE_PROVIDER } from "../price-provider.constant";
import nobitexConfig from "./nobitex.config";
import { NobitexService } from "./nobitex.service";

@Module({
    imports: [ConfigModule.forFeature(nobitexConfig), HttpModule],
    providers: [{ provide: PRICE_PROVIDER, useClass: NobitexService }],
    exports: [PRICE_PROVIDER],
})
export class NobitexModule {}
