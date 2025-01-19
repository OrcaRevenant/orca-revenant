import { Module } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [AssetRepository],
  exports: [AssetRepository],
})
export class AssetModule {}
