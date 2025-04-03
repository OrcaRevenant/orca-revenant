import { forwardRef, Module } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";
import { DatabaseModule } from "@/database/database.module";
import { AssetService } from "./asset.service";
import { AssetController } from "./asset.controller";
import { PriceModule } from "@/price/price.module";

@Module({
  imports: [DatabaseModule, forwardRef(() => PriceModule)],
  providers: [AssetRepository, AssetService],
  exports: [AssetRepository, AssetService],
  controllers: [AssetController],
})
export class AssetModule {}
