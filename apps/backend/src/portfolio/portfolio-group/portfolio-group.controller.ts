import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  Post,
  Body,
} from "@nestjs/common";
import { JwtGuard } from "@/auth/jwt.guard";
import { AuthUserRequest } from "@/shared/types/request.types";
import { PortfolioGroupService } from "./portfolio-group.service";
import { plainToInstance } from "class-transformer";
import { PortfolioGroupTreeResponseDto } from "./portfolio-group.dto";
import { ReorderItemsDto } from "./portfolio-items-reorder.dto";

@Controller("portfolio-groups")
@UseInterceptors(ClassSerializerInterceptor)
export class PortoflioGroupController {
  constructor(private readonly portfolioGroupService: PortfolioGroupService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getAll(
    @Req() req: AuthUserRequest,
    @Query("quote") quote: string = "usdt"
  ) {
    const userId = req.user.sub;
    const groups = await this.portfolioGroupService.getAllPopulated(
      userId,
      quote
    );

    return plainToInstance(PortfolioGroupTreeResponseDto, groups, {
      excludeExtraneousValues: true,
    });
  }

  @Post("reorder")
  @UseGuards(JwtGuard)
  async reorderItems(
    @Req() req: AuthUserRequest,
    @Body() dto: ReorderItemsDto
  ) {
    return this.portfolioGroupService.reorderItems(req.user.sub, dto);
  }
}
