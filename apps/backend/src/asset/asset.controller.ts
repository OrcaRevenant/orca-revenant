import { JwtGuard } from "@/auth/jwt.guard";
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AssetService } from "./asset.service";

@Controller("assets")
export class AssetController {
    constructor(
        private readonly assetService: AssetService,
    ) {
    }

    @Get(":symbol/history")
    @UseGuards(JwtGuard)
    async getHistory(
        @Param("symbol") symbol: string,
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
        @Query("resolution") resolution: "hourly" | "daily",
    ) {
        return this.assetService.getAssetHistory(
            symbol,
            new Date(startDate),
            new Date(endDate),
            resolution,
        );
    }
}
