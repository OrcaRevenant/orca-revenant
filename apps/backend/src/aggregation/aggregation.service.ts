import { PageOptionsDto } from "@/pagination/dto";
import { PortfolioGroupService } from "@/portfolio/portfolio-group/portfolio-group.service";
import { PortfolioService } from "@/portfolio/portfolio.service";
import { PortfolioType, Timeframe } from "@/portfolio/portfolio.types";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AggregationService {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly portfolioGroupService: PortfolioGroupService
  ) {}

  async getBalance(
    id: string,
    userId: string,
    type: PortfolioType,
    quote: string = "usdt"
  ): Promise<{ balance: number }> {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getBalance(portfolioIds, userId, quote);
  }

  async getAssets(
    id: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
    type: PortfolioType,
    quote: string = "usdt"
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAssetsPaginated(
      portfolioIds,
      userId,
      pageOptionsDto,
      quote
    );
  }

  async getAssetAllocation(
    id: string,
    userId: string,
    type: PortfolioType,
    quote: string = "usdt"
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAssetAllocation(
      portfolioIds,
      userId,
      quote
    );
  }

  async getAllocation(
    id: string,
    userId: string,
    type: PortfolioType,
    quote: string = "usdt"
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAllocation(portfolioIds, userId, quote);
  }

  async getTransactions(
    id: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
    type: PortfolioType,
    quote: string = "usdt"
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getTransactionsPaginated(
      portfolioIds,
      userId,
      pageOptionsDto,
      quote
    );
  }

  async getHistoricalBalance(
    id: string,
    userId: string,
    timeframe: Timeframe,
    type: PortfolioType,
    quote: string = "usdt"
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getHistoricalBalanceStrict(
      portfolioIds,
      userId,
      timeframe,
      quote
    );
  }

  async getAssetPerformance(
    id: string,
    userId: string,
    timeframe: Timeframe,
    type: PortfolioType,
    quote: string = "usdt"
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAssetPerformanceStrict(
      portfolioIds,
      userId,
      timeframe,
      quote
    );
  }

  async generateAdvice(
    id: string,
    userId: string,
    messages: any[],
    userLocation?: string,
    type: PortfolioType = "portfolio",
    quote: string = "usdt"
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.generateAdvice(
      portfolioIds,
      userId,
      messages,
      userLocation,
      quote
    );
  }

  private async getPortfolioIds(
    id: string,
    userId: string,
    type: PortfolioType
  ): Promise<string | string[]> {
    if (type === "group") {
      const portfolios = await this.portfolioGroupService.getById(id, userId);
      return portfolios.map((portfolio) => portfolio.id);
    }

    return id;
  }
}
