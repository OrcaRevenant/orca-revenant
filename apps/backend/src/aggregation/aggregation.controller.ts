import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/auth/jwt.guard";
import { AuthUserRequest } from "@/shared/types/request.types";
import { PageOptionsDto } from "@/pagination/dto";
import { AggregationService } from "./aggregation.service";
import { PortfolioType, Timeframe } from "@/portfolio/portfolio.types";

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
    @Query("quote") quote: string = "usdt"
  ) {
    return this.aggregationService.getAssets(
      id,
      req.user.sub,
      pageOptionsDto,
      type,
      quote
    );
  }

  @Get(":id/balance")
  async getBalance(
    @Req() req: AuthUserRequest,
    @Param("id") id: string,
    @Query("type") type: PortfolioType,
    @Query("quote") quote: string = "usdt"
  ) {
    return this.aggregationService.getBalance(id, req.user.sub, type, quote);
  }

  @Get(":id/assets/allocation")
  async getAssetAllocation(
    @Req() req: AuthUserRequest,
    @Param("id") id: string,
    @Query("type") type: PortfolioType,
    @Query("quote") quote: string = "usdt"
  ) {
    return this.aggregationService.getAssetAllocation(
      id,
      req.user.sub,
      type,
      quote
    );
  }

  @Get(":id/allocation")
  async getAllocation(
    @Req() req: AuthUserRequest,
    @Param("id") id: string,
    @Query("type") type: PortfolioType,
    @Query("quote") quote: string = "usdt"
  ) {
    return this.aggregationService.getAllocation(id, req.user.sub, type, quote);
  }

  @Get(":id/transactions")
  async getTransactions(
    @Req() req: AuthUserRequest,
    @Param("id") id: string,
    @Query() pageOptionsDto: PageOptionsDto,
    @Query("type") type: PortfolioType,
    @Query("quote") quote: string = "usdt"
  ) {
    return this.aggregationService.getTransactions(
      id,
      req.user.sub,
      pageOptionsDto,
      type,
      quote
    );
  }

  @Get(":id/balance/history")
  async getHistoricalBalance(
    @Req() req: AuthUserRequest,
    @Param("id") id: string,
    @Query("timeframe") timeframe: Timeframe,
    @Query("type") type: PortfolioType,
    @Query("quote") quote: string = "usdt"
  ) {
    return this.aggregationService.getHistoricalBalance(
      id,
      req.user.sub,
      timeframe,
      type,
      quote
    );
  }

  @Get(":id/assets/performance")
  @UseGuards(JwtGuard)
  async getAssetPerformance(
    @Req() req: AuthUserRequest,
    @Param("id") id: string,
    @Query("timeframe") timeframe: Timeframe,
    @Query("type") type: PortfolioType,
    @Query("quote") quote: string = "usdt"
  ) {
    const userId = req.user.sub;
    return this.aggregationService.getAssetPerformance(
      id,
      userId,
      timeframe,
      type,
      quote
    );
  }
}
