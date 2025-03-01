import { Module } from "@nestjs/common";
import { AssetDetailsService } from "./asset-details.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import assetDetailsConfig from "./asset-details.config";

@Module({
  imports: [ConfigModule.forFeature(assetDetailsConfig), HttpModule],
  providers: [AssetDetailsService],
  exports: [AssetDetailsService],
})
export class AssetDetailsModule {}
