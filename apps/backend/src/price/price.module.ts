import { forwardRef, Module } from "@nestjs/common";
import { MockModule } from "./mock/mock.module";
import { PriceService } from "./price.service";
import priceConfig from "./price.config";
import { ConfigModule } from "@nestjs/config";
import { BackfillModule } from "./backfill/backfill.module";
import { PriceRepository } from "./price.repository";
import { AssetModule } from "@/asset/asset.module";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [
    ConfigModule.forFeature(priceConfig),
    MockModule,
    DatabaseModule,
    AssetModule,
    forwardRef(() => BackfillModule),
  ],
  providers: [PriceService, PriceRepository],
  exports: [PriceService, PriceRepository],
})
export class PriceModule {
}
