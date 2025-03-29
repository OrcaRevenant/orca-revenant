import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AssetModule } from "@/asset/asset.module";
import { DatabaseModule } from "@/database/database.module";
import { BackfillModule } from "./backfill/backfill.module";
import priceConfig from "./price.config";
import { PriceRepository } from "./price.repository";
import { PriceService } from "./price.service";
import { AssetDetailsModule } from "@/asset-details/asset-details.module";
import { BinanceModule } from "./providers/binance/binance.module";
import { PriceProviderModule } from "./providers/price-provider.module";
import { PriceConversionService } from "./price-conversion.service";

@Module({
  imports: [
    ConfigModule.forFeature(priceConfig),
    DatabaseModule,
    AssetModule,
    AssetDetailsModule,
    BackfillModule,
    BinanceModule,
    PriceProviderModule,
  ],
  providers: [PriceService, PriceRepository, PriceConversionService],
  exports: [PriceService, PriceRepository, PriceConversionService],
})
export class PriceModule {}
