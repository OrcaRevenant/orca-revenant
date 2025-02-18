import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
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
