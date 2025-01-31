import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/auth/jwt.guard";
import { AuthUserRequest } from "@/shared/types/request.types";
import { PortfolioGroupService } from "./portfolio-group.service";

@Controller("portfolio-groups")
export class PortoflioGroupController {
    constructor(
        private readonly portfolioGroupService: PortfolioGroupService,
    ) {
    }

    @Get()
    @UseGuards(JwtGuard)
    async getAll(
        @Req() req: AuthUserRequest,
    ) {
        const userId = req.user.sub;
        return this.portfolioGroupService.getAll(userId);
    }

    @Get(":id")
    @UseGuards(JwtGuard)
    async getById(
        @Req() req: AuthUserRequest,
        @Param("id") id: string,
    ) {
        const userId = req.user.sub;
        return this.portfolioGroupService.getById(id, userId);
    }
}
