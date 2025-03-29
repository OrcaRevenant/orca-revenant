import { Injectable } from "@nestjs/common";
import { PortfolioRepository } from "./portfolio.repository";
import { PortfolioSyncService } from "@/portfolio/portfolio-sync/portfolio-sync.service";
import { PageOptionsDto } from "@/pagination/dto";
import { PopulatedPortfolio, Portfolio, Timeframe } from "./portfolio.types";
import { PortfolioAssetService } from "./portfolio-asset/portfolio-asset.service";
import { TransactionService } from "@/transaction/transaction.service";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./portfolio.dto";
import { calculateDateRange } from "./portfolio.utils";
import { PriceConversionService } from "@/price/price-conversion.service";

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly portfolioSyncService: PortfolioSyncService,
    private readonly transactionService: TransactionService,
    private readonly portfolioAssetService: PortfolioAssetService,
    private readonly priceConversionService: PriceConversionService
  ) {}

  async getBalance(
    id: string | string[],
    userId: string,
    quote: string = "usdt"
  ): Promise<{ balance: number }> {
    const balance = await this.portfolioRepository.findBalance(id, userId);

    const convertedBalance = await this.priceConversionService.convertPrice(
      balance,
      quote
    );

    return { balance: convertedBalance };
  }

  async getAssets(
    id: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto,
    quote: string = "usdt"
  ) {
    const result = await this.portfolioAssetService.getByPortfolioIdPaginated(
      id,
      userId,
      pageOptionsDto
    );

    const priceList = result.list.flatMap((asset) => [
      {
        asset: asset.asset,
        price: asset.value,
      },
      {
        asset: asset.asset,
        price: asset.price_per_unit,
      },
    ]);

    const convertedPrices = await this.priceConversionService.convertPrices(
      priceList,
      quote
    );

    return result.list.map((asset, index) => ({
      ...asset,
      value: convertedPrices[index * 2].price,
      price_per_unit: convertedPrices[index * 2 + 1].price,
    }));
  }

  async getAssetAllocation(
    id: string | string[],
    userId: string,
    quote: string = "usdt"
  ) {
    const allocation = await this.portfolioAssetService.getAllocation(
      id,
      userId
    );

    const priceList = allocation.map((item) => ({
      asset: item.asset.symbol,
      price: item.value,
    }));

    const convertedPrices = await this.priceConversionService.convertPrices(
      priceList,
      quote
    );

    // Map the converted prices back to the allocation objects
    return allocation.map((item, index) => ({
      ...item,
      value: convertedPrices[index].price,
    }));
  }

  async getAllocation(
    id: string | string[],
    userId: string,
    quote: string = "usdt"
  ) {
    const allocations = await this.portfolioRepository.findPortfolioAllocation(
      id,
      userId
    );

    const priceList = allocations.map((item) => ({
      asset: item.portfolio.id,
      price: item.balance,
    }));

    const convertedPrices = await this.priceConversionService.convertPrices(
      priceList,
      quote
    );

    return allocations.map((item, index) => ({
      portfolio: item.portfolio,
      balance: convertedPrices[index].price,
      percentage: item.percentage,
    }));
  }

  async getTransactions(
    id: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto,
    quote: string = "usdt"
  ) {
    const result = await this.transactionService.findByPortfolioIdPaginated(
      id,
      userId,
      pageOptionsDto
    );

    const priceList = result.list.flatMap((tx) => [
      {
        asset: tx.asset.symbol,
        price: tx.value ?? 0,
      },
      {
        asset: tx.portfolio.id,
        price: tx.portfolio_total_value,
      },
    ]);

    const convertedPrices = await this.priceConversionService.convertPrices(
      priceList,
      quote
    );

    return {
      ...result,
      list: result.list.map((tx, index) => ({
        ...tx,
        value: tx.value === null ? null : convertedPrices[index * 2].price,
        portfolio_total_value: convertedPrices[index * 2 + 1].price,
      })),
    };
  }

  async getHistoricalBalanceStrict(
    id: string | string[],
    userId: string,
    timeframe: Timeframe,
    quote: string = "usdt"
  ) {
    const { startDate, endDate, resolution } = calculateDateRange(timeframe);
    return this.getHistoricalBalance(
      id,
      userId,
      startDate,
      endDate,
      resolution,
      quote
    );
  }

  async getHistoricalBalance(
    id: string | string[],
    userId: string,
    startDate: Date,
    endDate: Date,
    resolution: string,
    quote: string = "usdt"
  ) {
    const balanceHistory = await this.portfolioRepository.findBalanceHistory(
      id,
      userId,
      startDate,
      endDate,
      resolution
    );

    const latestTimestamp = new Date(
      (balanceHistory[balanceHistory.length - 1] as any).time || new Date()
    );
    const conversionRate = await this.priceConversionService.getConversionRate(
      quote,
      latestTimestamp
    );

    const convertedHistory = balanceHistory.map((record: any) => {
      const convertedBalances = record.balances.map((balance: any) => ({
        ...balance,
        value: (Number(balance.value) / conversionRate).toString(),
        price_per_unit: (
          Number(balance.price_per_unit) / conversionRate
        ).toString(),
      }));

      return {
        time: record.time,
        balances: convertedBalances,
        total_value: (Number(record.total_value) / conversionRate).toString(),
      };
    });

    return convertedHistory;
  }

  async getAssetPerformanceStrict(
    id: string | string[],
    userId: string,
    timeframe: Timeframe,
    quote: string = "usdt"
  ) {
    const { startDate, endDate } = calculateDateRange(timeframe);
    return this.getAssetPerformance(id, userId, startDate, endDate, quote);
  }

  async getAssetPerformance(
    id: string | string[],
    userId: string,
    startDate: Date,
    endDate: Date,
    quote: string = "usdt"
  ) {
    const performance = await this.portfolioRepository.findBestPerformingAsset(
      id,
      userId,
      startDate,
      endDate
    );

    const conversionRate = await this.priceConversionService.getConversionRate(
      quote,
      endDate
    );

    return {
      asset: performance.asset,
      start_price: performance.start_price / conversionRate,
      current_price: performance.current_price / conversionRate,
      price_change: performance.price_change / conversionRate,
      percentage_change: performance.percentage_change,
      total_value: performance.total_value / conversionRate,
      pnl: performance.pnl / conversionRate,
      amount: performance.amount,
    };
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
