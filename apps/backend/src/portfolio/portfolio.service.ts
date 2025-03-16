import { Injectable } from "@nestjs/common";
import { PortfolioRepository } from "./portfolio.repository";
import { PortfolioSyncService } from "@/portfolio/portfolio-sync/portfolio-sync.service";
import { PageOptionsDto } from "@/pagination/dto";
import { PopulatedPortfolio, Portfolio, Timeframe } from "./portfolio.types";
import { PortfolioAssetService } from "./portfolio-asset/portfolio-asset.service";
import { TransactionService } from "@/transaction/transaction.service";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./portfolio.dto";
import { calculateDateRange } from "./portfolio.utils";

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly portfolioSyncService: PortfolioSyncService,
    private readonly transactionService: TransactionService,
    private readonly portfolioAssetService: PortfolioAssetService
  ) {}

  async getBalance(
    id: string | string[],
    userId: string
  ): Promise<{ balance: number }> {
    const balance = await this.portfolioRepository.findBalance(id, userId);

    return { balance };
  }

  async getAssets(
    id: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto
  ) {
    return this.portfolioAssetService.getByPortfolioIdPaginated(
      id,
      userId,
      pageOptionsDto
    );
  }

  async getAssetAllocation(id: string | string[], userId: string) {
    return this.portfolioAssetService.getAllocation(id, userId);
  }

  async getAllocation(id: string | string[], userId: string) {
    return this.portfolioRepository.findPortfolioAllocation(id, userId);
  }

  async getTransactions(
    id: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto
  ) {
    return this.transactionService.findByPortfolioIdPaginated(
      id,
      userId,
      pageOptionsDto
    );
  }

  async getHistoricalBalanceStrict(
    id: string | string[],
    userId: string,
    timeframe: Timeframe
  ) {
    const { startDate, endDate, resolution } = calculateDateRange(timeframe);
    return this.getHistoricalBalance(
      id,
      userId,
      startDate,
      endDate,
      resolution
    );
  }

  async getHistoricalBalance(
    id: string | string[],
    userId: string,
    startDate: Date,
    endDate: Date,
    resolution: string
  ) {
    return this.portfolioRepository.findBalanceHistory(
      id,
      userId,
      startDate,
      endDate,
      resolution
    );
  }

  async getAssetPerformanceStrict(
    id: string | string[],
    userId: string,
    timeframe: Timeframe
  ) {
    const { startDate, endDate } = calculateDateRange(timeframe);
    return this.getAssetPerformance(id, userId, startDate, endDate);
  }

  async getAssetPerformance(
    id: string | string[],
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.portfolioRepository.findBestPerformingAsset(
      id,
      userId,
      startDate,
      endDate
    );
  }

  async getAssetPriceHistoryChart(
    userId: string,
    asset: string,
    startDate: Date,
    endDate: Date,
    resolution: "hourly" | "daily"
  ) {
    return this.portfolioRepository.findAssetPriceHistory(
      userId,
      asset,
      startDate,
      endDate,
      resolution
    );
  }

  async sync(id: string, userId: string) {
    const portoflio = await this.portfolioRepository.findByIdAndUser(
      id,
      userId
    );

    return this.portfolioSyncService.enqueueSyncJob(portoflio);
  }

  async getAll(): Promise<Portfolio[]> {
    const portfolios = await this.portfolioRepository.findAll();
    return portfolios;
  }
  async getAllPopulated(): Promise<PopulatedPortfolio[]> {
    const portfolios = await this.portfolioRepository.findAll();
    return this.portfolioRepository.populatePortfolio(portfolios);
  }

  async findByUserId(userId: string): Promise<Portfolio[]> {
    const portfolio = await this.portfolioRepository.findByUser(userId);
    return portfolio;
  }
  async findByUserIdPopulated(userId: string): Promise<PopulatedPortfolio[]> {
    const portfolio = await this.findByUserId(userId);
    return this.portfolioRepository.populatePortfolio(portfolio);
  }

  async getStatus(id: string, userId: string) {
    const portfolio = await this.portfolioRepository.findByIdAndUser(
      id,
      userId
    );
    return {
      status: portfolio.status,
    };
  }

  async getById(id: string, userId: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findByIdAndUser(
      id,
      userId
    );

    return portfolio;
  }

  async getByIdPopulated(
    id: string,
    userId: string
  ): Promise<PopulatedPortfolio> {
    const portfolio = await this.getById(id, userId);
    const result = await this.portfolioRepository.populatePortfolio(portfolio);
    return result[0];
  }

  async create(createPortfolioDto: CreatePortfolioDto, userId: string) {
    const portfolio = await this.portfolioRepository.insert({
      meta: createPortfolioDto.meta,
      connection_name: createPortfolioDto.connection,
      title: createPortfolioDto.title,
      color: createPortfolioDto.color,
      user_id: userId,
    });

    await this.portfolioSyncService.enqueueSyncJob(portfolio);

    const result = await this.portfolioRepository.populatePortfolio(portfolio);
    return result[0];
  }

  async update(
    id: string,
    updatePortfolioDto: UpdatePortfolioDto,
    userId: string
  ) {
    const portfolio = await this.portfolioRepository.updateById(id, {
      meta: updatePortfolioDto.meta,
      connection_name: updatePortfolioDto.connection,
      title: updatePortfolioDto.title,
      color: updatePortfolioDto.color,
      user_id: userId,
    });

    await this.portfolioSyncService.enqueueSyncJob(portfolio);

    const result = await this.portfolioRepository.populatePortfolio(portfolio);
    return result[0];
  }

  async remove(id: string, userId: string) {
    return this.portfolioRepository.deleteById(id, userId);
  }

  async updateStatusById(
    portfolioId: string,
    userId: string,
    status: Portfolio["status"]
  ) {
    const portfolio = await this.portfolioRepository.updateStatusById(
      portfolioId,
      userId,
      status
    );

    const result = await this.portfolioRepository.populatePortfolio(portfolio);
    return result[0];
  }

  async isOwner(portfolioId: string, userId: string): Promise<boolean> {
    return this.portfolioRepository.isOwner(portfolioId, userId);
  }

  async getUnsynced(minutes: number): Promise<Portfolio[]> {
    return this.portfolioRepository.findUnsynced(minutes);
  }
}
