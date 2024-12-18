import { DynamicModule, Module } from "@nestjs/common";
import { MockModule } from "./mock/mock.module";
import { PriceService } from "./price.service";
import { SupabaseModule } from "@/supabase/supabase.module";

@Module({})
export class PriceModule {
  static forRoot(useMock: boolean): DynamicModule {
    const providerModule = useMock ? MockModule : MockModule;

    return {
      module: PriceModule,
      imports: [providerModule, SupabaseModule],
      providers: [PriceService],
      exports: [PriceService],
    };
  }
}
