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
    type: PortfolioType
  ): Promise<{ balance: number }> {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getBalance(portfolioIds, userId);
  }

  async getAssets(
    id: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
    type: PortfolioType
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAssets(
      portfolioIds,
      userId,
      pageOptionsDto
    );
  }

  async getAssetAllocation(id: string, userId: string, type: PortfolioType) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAssetAllocation(portfolioIds, userId);
  }

  async getAllocation(id: string, userId: string, type: PortfolioType) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAllocation(portfolioIds, userId);
  }

  async getTransactions(
    id: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
    type: PortfolioType
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getTransactions(
      portfolioIds,
      userId,
      pageOptionsDto
    );
  }

  async getHistoricalBalance(
    id: string,
    userId: string,
    timeframe: Timeframe,
    type: PortfolioType
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getHistoricalBalanceStrict(
      portfolioIds,
      userId,
      timeframe
    );
  }

  async getAssetPerformance(
    id: string,
    userId: string,
    timeframe: Timeframe,
    type: PortfolioType
  ) {
    const portfolioIds = await this.getPortfolioIds(id, userId, type);
    return this.portfolioService.getAssetPerformanceStrict(
      portfolioIds,
      userId,
      timeframe
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
