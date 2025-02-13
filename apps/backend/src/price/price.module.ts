// price.module.ts
import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AssetModule } from "@/asset/asset.module";
import { DatabaseModule } from "@/database/database.module";
import { BackfillModule } from "./backfill/backfill.module";
import priceConfig from "./price.config";
import { PriceRepository } from "./price.repository";
import { PriceService } from "./price.service";
import { AlphaVantageModule } from "./providers/alpha-ventage/alpha-ventage.module";
import { TradingViewModule } from "./providers/tradingview/tradingview.module";
import { MockModule } from "./providers/mock/mock.module";

@Module({})
export class PriceModule {
  static forRoot(providerChoice: string = "mock"): DynamicModule {
    const providerModule = {
      "alpha-ventage": AlphaVantageModule,
      tradingview: TradingViewModule,
      mock: MockModule,
    }[providerChoice];

    return {
      module: PriceModule,
      imports: [
        ConfigModule.forFeature(priceConfig),
        DatabaseModule,
        AssetModule,
        BackfillModule,
        providerModule,
      ],
      providers: [PriceService, PriceRepository],
      exports: [PriceService, PriceRepository],
      global: true,
    };
  }
}
