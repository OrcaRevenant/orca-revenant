import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/auth/jwt.guard";
import { AuthUserRequest } from "@/shared/types/request.types";
import { PageOptionsDto } from "@/pagination/dto";
import { AggregationService } from "./aggregation.service";
import { PortfolioType } from "@/portfolio/portfolio.types";

@Controller("aggregation")
@UseGuards(JwtGuard)
export class AggregationController {
    constructor(private readonly aggregationService: AggregationService) {}

    @Get(":id/assets")
    async getAssets(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query() pageOptionsDto: PageOptionsDto,
        @Query("type") type: PortfolioType,
    ) {
        return this.aggregationService.getAssets(
            id,
            req.user.sub,
            pageOptionsDto,
            type,
        );
    }

    @Get(":id/balance")
    async getBalance(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("type") type: PortfolioType,
    ) {
        return this.aggregationService.getBalance(id, req.user.sub, type);
    }

    @Get(":id/assets/allocation")
    async getAssetAllocation(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("type") type: PortfolioType,
    ) {
        return this.aggregationService.getAssetAllocation(
            id,
            req.user.sub,
            type,
        );
    }

    @Get(":id/transactions")
    async getTransactions(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query() pageOptionsDto: PageOptionsDto,
        @Query("type") type: PortfolioType,
    ) {
        return this.aggregationService.getTransactions(
            id,
            req.user.sub,
            pageOptionsDto,
            type,
        );
    }

    @Get(":id/balance/history")
    async getHistoricalBalance(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
        @Query("resolution") resolution: "hourly" | "daily",
        @Query("type") type: PortfolioType,
    ) {
        return this.aggregationService.getHistoricalBalance(
            id,
            req.user.sub,
            new Date(startDate),
            new Date(endDate),
            resolution,
            type,
        );
    }

    @Get(":id/asset/performance")
    @UseGuards(JwtGuard)
    async getAssetPerformance(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
        @Query("type") type: PortfolioType = "portfolio",
    ) {
        const userId = req.user.sub;
        return this.aggregationService.getAssetPerformance(
            id,
            userId,
            new Date(startDate),
            new Date(endDate),
            type,
        );
    }
}
