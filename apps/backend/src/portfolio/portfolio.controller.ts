import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "@/auth/jwt.guard";
import { PortfolioService } from "./portfolio.service";
import { AuthUserRequest } from "@/shared/types/request.types";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./portfolio.dto";

@Controller("portfolios")
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Get()
    @UseGuards(JwtGuard)
    async getAll(@Req() req: AuthUserRequest) {
        const userId = req.user.sub;
        return this.portfolioService.getAllByUserId(userId);
    }

    @Get(":id")
    @UseGuards(JwtGuard)
    async getById(@Req() req: AuthUserRequest, @Param("id") id: string) {
        const userId = req.user.sub;
        return this.portfolioService.getOneByUserId(id, userId);
    }

    @Delete(":id")
    @UseGuards(JwtGuard)
    async delete(@Req() req: AuthUserRequest, @Param("id") id: string) {
        const userId = req.user.sub;
        return this.portfolioService.delete(id, userId);
    }

    @Post()
    @UseGuards(JwtGuard)
    async create(
        @Req() req: AuthUserRequest,
        @Body() body: CreatePortfolioDto,
    ) {
        const userId = req.user.sub;
        return this.portfolioService.create({
            user_id: userId,
            api_key: body.apiKey,
            connection_name: body.connection,
            title: body.title,
            color: body.color,
        });
    }

    @Patch(":id")
    @UseGuards(JwtGuard)
    async update(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
        @Body() body: UpdatePortfolioDto,
    ) {
        const userId = req.user.sub;
        return this.portfolioService.update(id, {
            user_id: userId,
            api_key: body.apiKey,
            connection_name: body.connection,
            title: body.title,
            color: body.color,
        });
    }
}
