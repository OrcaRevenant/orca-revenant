import { Module } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";
import { SupabaseModule } from "@/common/supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  providers: [AssetRepository],
  exports: [AssetRepository],
})
export class AssetModule {}
