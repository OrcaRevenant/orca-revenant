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
import { CreatePortfolioDto, UpdatePortfolioDto } from "./dto";

@Controller("portfolios")
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Get()
    @UseGuards(JwtGuard)
    async findAll(@Req() req: AuthUserRequest) {
        const userId = req.user.sub;
        return this.portfolioService.findAll(userId);
    }

    @Get(":id")
    @UseGuards(JwtGuard)
    async findOne(@Req() req: AuthUserRequest, @Param("id") id: string) {
        const userId = req.user.sub;
        return this.portfolioService.findOne(id, userId);
    }

    @Delete(":id")
    @UseGuards(JwtGuard)
    async remove(@Req() req: AuthUserRequest, @Param("id") id: string) {
        const userId = req.user.sub;
        return this.portfolioService.remove(id, userId);
    }

    @Post()
    @UseGuards(JwtGuard)
    async create(
        @Req() req: AuthUserRequest,
        @Body() dto: CreatePortfolioDto,
    ) {
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
}
