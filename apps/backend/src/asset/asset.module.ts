import { Module } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";
import { DatabaseModule } from "@/database/database.module";
import { AssetService } from "./asset.service";
import { AssetController } from './asset.controller';

@Module({
  imports: [DatabaseModule],
  providers: [AssetRepository, AssetService],
  exports: [AssetRepository, AssetService],
  controllers: [AssetController],
})
export class AssetModule {}
