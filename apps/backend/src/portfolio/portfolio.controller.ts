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
import { PortfolioStatusUpdate } from "./portfolio.types";
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
    async findAll(@Req() req: AuthUserRequest) {
        const userId = req.user.sub;
        return this.portfolioService.findByUserId(userId);
    }

    @Get(":id")
    @UseGuards(JwtGuard)
    async findOne(@Req() req: AuthUserRequest, @Param("id") id: string) {
        const userId = req.user.sub;
        return this.portfolioService.findOneByUserId(id, userId);
    }

    @Get(":id/transactions")
    @UseGuards(JwtGuard)
    async findPortfolioTransactions(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Query() pageOptionsDto: PageOptionsDto,
    ) {
        const userId = req.user.sub;
        return this.portfolioService.findUserPortfolioTransactions(
            id,
            userId,
            pageOptionsDto,
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
    async sync(@Req() req: AuthUserRequest, @Param("id") id: string) {
        const userId = req.user.sub;
        return this.portfolioService.sync(id, userId);
    }

    @Sse(":id/events")
    @UseGuards(JwtGuard)
    async notifyPortfolioStatus(
        @Req() req: AuthUserRequest,
        @Param("id") id: UniqueIdentifier,
    ): Promise<Observable<PortfolioStatusUpdate>> {
        const userId = req.user.sub;

        const isOwner = await this.portfolioService.isPortfolioOwner(
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
