import { Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core/discovery";
import { BinanceModule } from "./binance/binance.module";
import { MockModule } from "./mock/mock.module";
import { PriceProviderRegistry } from "./price-provider.registry";
import { NobitexModule } from "./nobitex/nobitex.module";

@Module({
    imports: [
        DiscoveryModule,
        BinanceModule,
        NobitexModule,
        MockModule,
    ],
    providers: [
        PriceProviderRegistry,
    ],
    exports: [
        PriceProviderRegistry,
    ],
})
export class PriceProviderModule {}
