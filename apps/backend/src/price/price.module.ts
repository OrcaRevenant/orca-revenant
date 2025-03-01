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

@Module({
  imports: [
    ConfigModule.forFeature(priceConfig),
    DatabaseModule,
    AssetModule,
    AssetDetailsModule,
    BackfillModule,
    BinanceModule,
  ],
  providers: [PriceService, PriceRepository],
  exports: [PriceService, PriceRepository],
})
export class PriceModule {
}
