import { JwtGuard } from "@/auth/jwt.guard";
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AssetService } from "./asset.service";
import { Timeframe } from "@/portfolio/portfolio.types";

@Controller("assets")
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get(":symbol/history")
  @UseGuards(JwtGuard)
  async getHistory(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: Timeframe
  ) {
    return this.assetService.getAssetHistoryStrict(symbol, timeframe);
  }
}
