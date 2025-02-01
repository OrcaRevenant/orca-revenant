import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Sse,
    UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "@/auth/jwt.guard";
import { PortfolioService } from "./portfolio.service";
import { AuthUserRequest } from "@/shared/types/request.types";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./dto";
import { filter, map, Observable } from "rxjs";
import { PortfolioEventService } from "./portfolio-event.service";
import { PortfolioStatusUpdate, PortfolioType } from "./portfolio.types";
import { UniqueIdentifier } from "@/connection/connection.abstract";
import { PageOptionsDto } from "@/pagination/dto";

@Controller("portfolios")
export class PortfolioController {
    constructor(
        private readonly portfolioService: PortfolioService,
        private readonly portfolioEventService: PortfolioEventService,
    ) {
    }

    @Get()
    @UseGuards(JwtGuard)
    async getAll(
        @Req() req: AuthUserRequest,
    ) {
        const userId = req.user.sub;
        return this.portfolioService.findByUserId(userId);
    }

    @Get(":id/balance")
    @UseGuards(JwtGuard)
    async getBalance(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("type") type: PortfolioType = "portfolio",
    ) {
        const userId = req.user.sub;
        return this.portfolioService.getBalance(
            id,
            userId,
            type,
        );
    }

    @Get(":id/assets/allocation")
    @UseGuards(JwtGuard)
    async getAssetsAllocation(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("type") type: PortfolioType = "portfolio",
    ) {
        const userId = req.user.sub;

        return this.portfolioService.getAssetAllocation(
            id,
            userId,
            type,
        );
    }

    @Get(":id/assets")
    @UseGuards(JwtGuard)
    async getAssets(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query() pageOptionsDto: PageOptionsDto,
        @Query("type") type: PortfolioType = "portfolio",
    ) {
        const userId = req.user.sub;

        return this.portfolioService.getAssets(
            id,
            userId,
            pageOptionsDto,
            type,
        );
    }

    @Get(":id/transactions")
    @UseGuards(JwtGuard)
    async getTransactions(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query() pageOptionsDto: PageOptionsDto,
        @Query("type") type: PortfolioType = "portfolio",
    ) {
        const userId = req.user.sub;

        return this.portfolioService.getTransactions(
            id,
            userId,
            pageOptionsDto,
            type,
        );
    }

    @Get(":id/balance/history")
    @UseGuards(JwtGuard)
    async getHistoricalPortfolioValue(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
        @Query("resolution") resolution: "hourly" | "daily",
        @Query("type") type: PortfolioType = "portfolio",
    ) {
        const userId = req.user.sub;

        return this.portfolioService.getHistoricalBalance(
            id,
            userId,
            new Date(startDate),
            new Date(endDate),
            resolution,
            type,
        );
    }

    @Get(":id")
    @UseGuards(JwtGuard)
    async getById(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
    ) {
        const userId = req.user.sub;
        return this.portfolioService.getById(id, userId);
    }

    @Get(":id/status")
    @UseGuards(JwtGuard)
    async getStatus(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
    ) {
        const userId = req.user.sub;

        return this.portfolioService.getStatus(
            id,
            userId,
        );
    }

    @Delete(":id")
    @UseGuards(JwtGuard)
    async remove(@Req() req: AuthUserRequest, @Param("id") id: string) {
        const userId = req.user.sub;
        return this.portfolioService.remove(id, userId);
    }

    @Post()
    @UseGuards(JwtGuard)
    async create(@Req() req: AuthUserRequest, @Body() dto: CreatePortfolioDto) {
        const userId = req.user.sub;
        return this.portfolioService.create(dto, userId);
    }

    @Patch(":id")
    @UseGuards(JwtGuard)
    async update(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Body() dto: UpdatePortfolioDto,
    ) {
        const userId = req.user.sub;
        return this.portfolioService.update(id, dto, userId);
    }

    @Post(":id/sync")
    @UseGuards(JwtGuard)
    async sync(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
    ) {
        const userId = req.user.sub;

        return this.portfolioService.sync(id, userId);
    }

    // TODO:: should move to asset module
    @Get(":id/assets/:asset/history")
    @UseGuards(JwtGuard)
    async getAssetChart(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Param("asset") asset: string,
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
        @Query("resolution") resolution: "hourly" | "daily",
    ) {
        const userId = req.user.sub;
        return this.portfolioService.getAssetPriceHistoryChart(
            id,
            userId,
            asset,
            new Date(startDate),
            new Date(endDate),
            resolution,
        );
    }

    @Get(":id/asset/performance")
    @UseGuards(JwtGuard)
    async getAssetPerformance(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
    ) {
        const userId = req.user.sub;

        return this.portfolioService.getAssetPerformance(
            id,
            userId,
            new Date(startDate),
            new Date(endDate),
        );
    }

    @Sse(":id/events")
    @UseGuards(JwtGuard)
    async notifyPortfolioStatus(
        @Req() req: AuthUserRequest,
        @Param("id") id: UniqueIdentifier,
    ): Promise<Observable<PortfolioStatusUpdate>> {
        const userId = req.user.sub;

        const isOwner = await this.portfolioService.isOwner(
            `${id}`,
            userId,
        );

        if (!isOwner) {
            throw new NotFoundException();
        }

        return this.portfolioEventService.getEvents().pipe(
            filter((update) =>
                update.portfolioId === id && update.userId === userId
            ),
            map((update) => {
                return update;
            }),
        );
    }
}
