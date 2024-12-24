import { DynamicModule, Module } from "@nestjs/common";
import { MockModule } from "./mock/mock.module";
import { PriceService } from "./price.service";
import { SupabaseModule } from "@/supabase/supabase.module";
import priceConfig from "./price.config";
import { ConfigModule } from "@nestjs/config";

@Module({
  providers: [],
})
export class PriceModule {
  static forRoot(useMock: boolean): DynamicModule {
    const providerModule = useMock ? MockModule : MockModule;

    return {
      module: PriceModule,
      imports: [
        ConfigModule.forFeature(priceConfig),
        providerModule,
        SupabaseModule,
      ],
      providers: [PriceService],
      exports: [PriceService],
    };
  }
}
