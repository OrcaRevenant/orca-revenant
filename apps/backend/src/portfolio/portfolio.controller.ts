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
  UseInterceptors,
} from "@nestjs/common";
import { JwtGuard } from "@/auth/jwt.guard";
import { PortfolioService } from "./portfolio.service";
import { AuthUserRequest } from "@/shared/types/request.types";
import { filter, map, Observable } from "rxjs";
import { PortfolioEventService } from "./portfolio-event.service";
import { PopulatedPortfolio, PortfolioStatusUpdate } from "./portfolio.types";
import { UniqueIdentifier } from "@/connection/connection.abstract";
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  PopulatedPortfolioResponseDto,
} from "./portfolio.dto";
import { ClassSerializerInterceptor } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

@Controller("portfolios")
@UseInterceptors(ClassSerializerInterceptor)
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly portfolioEventService: PortfolioEventService
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  async getAll(@Req() req: AuthUserRequest) {
    const userId = req.user.sub;
    const portfolios =
      await this.portfolioService.findByUserIdPopulated(userId);

    return plainToInstance(PopulatedPortfolioResponseDto, portfolios, {
      excludeExtraneousValues: true,
    });
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  async getById(
    @Req() req: AuthUserRequest,
    @Param("id") id: string
  ): Promise<PopulatedPortfolio> {
    const userId = req.user.sub;
    const portfolio = await this.portfolioService.getByIdPopulated(id, userId);
    return plainToInstance(PopulatedPortfolioResponseDto, portfolio, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(":id")
  @UseGuards(JwtGuard)
  async remove(@Req() req: AuthUserRequest, @Param("id") id: string) {
    const userId = req.user.sub;
    return this.portfolioService.remove(id, userId);
  }

  @Get(":id/status")
  @UseGuards(JwtGuard)
  async getStatus(@Req() req: AuthUserRequest, @Param("id") id: string) {
    const userId = req.user.sub;
    return this.portfolioService.getStatus(id, userId);
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(@Req() req: AuthUserRequest, @Body() dto: CreatePortfolioDto) {
    const userId = req.user.sub;
    const portfolio = await this.portfolioService.create(dto, userId);
    return plainToInstance(PopulatedPortfolioResponseDto, portfolio, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(":id")
  @UseGuards(JwtGuard)
  async update(
    @Req() req: AuthUserRequest,
    @Param("id") id: string,
    @Body() dto: UpdatePortfolioDto
  ) {
    const userId = req.user.sub;
    const portfolio = await this.portfolioService.update(id, dto, userId);

    return plainToInstance(PopulatedPortfolioResponseDto, portfolio, {
      excludeExtraneousValues: true,
    });
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
    @Param("id") id: UniqueIdentifier
  ): Promise<Observable<PortfolioStatusUpdate>> {
    const userId = req.user.sub;

    const isOwner = await this.portfolioService.isOwner(`${id}`, userId);

    if (!isOwner) {
      throw new NotFoundException();
    }

    return this.portfolioEventService.getEvents().pipe(
      filter((update) => update.portfolioId === id && update.userId === userId),
      map((update) => {
        return update;
      })
    );
  }
}
