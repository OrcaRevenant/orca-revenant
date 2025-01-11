import { forwardRef, Module } from "@nestjs/common";
import { MockModule } from "./mock/mock.module";
import { PriceService } from "./price.service";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import priceConfig from "./price.config";
import { ConfigModule } from "@nestjs/config";
import { BackfillModule } from "./backfill/backfill.module";
import { PriceRepository } from "./price.repository";
import { AssetModule } from "@/asset/asset.module";

@Module({
  imports: [
    ConfigModule.forFeature(priceConfig),
    MockModule,
    SupabaseModule,
    AssetModule,
    forwardRef(() => BackfillModule),
  ],
  providers: [PriceService, PriceRepository],
  exports: [PriceService, PriceRepository],
})
export class PriceModule {
}
