import { Injectable } from "@nestjs/common";
import { PortfolioRepository } from "./portfolio.repository";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./dto";
import { PortfolioSyncService } from "@/portfolio/portfolio-sync/portfolio-sync.service";
import { TransactionRepository } from "@/transaction/transaction.repository";
import { PageOptionsDto } from "@/pagination/dto";
import { Portfolio, PortfolioType } from "./portfolio.types";
import { PortfolioAssetService } from "./portfolio-asset/portfolio-asset.service";
import { PortfolioGroupService } from "./portfolio-group/portfolio-group.service";

@Injectable()
export class PortfolioService {
    constructor(
        private readonly portfolioRepository: PortfolioRepository,
        private readonly portfolioSyncService: PortfolioSyncService,
        private readonly transactionRepository: TransactionRepository,
        private readonly portfolioAssetService: PortfolioAssetService,
        private readonly portfolioGroupService: PortfolioGroupService,
    ) {
    }

    /**
     * Retrieves the balance for either a single portfolio or a group of portfolios
     * @param id - Portfolio ID or group ID
     * @param userId - User's unique identifier
     * @param type - Type of portfolio (single or group)
     * @returns Object containing the portfolio balance
     */
    async getBalance(
        id: string,
        userId: string,
        type: PortfolioType,
    ): Promise<{ balance: number }> {
        const portfolioIds = await this.getPortfolioIds(id, userId, type);
        const balance = await this.portfolioRepository.findPortfolioBalance(
            portfolioIds,
            userId,
        );

        return { balance };
    }

    async getHistoricalBalance(
        portfolioId: string,
        userId: string,
        startDate: Date,
        endDate: Date,
        resolution: "hourly" | "daily",
    ) {
        return this.portfolioRepository.findHistoricalBalance(
            portfolioId,
            userId,
            startDate,
            endDate,
            resolution,
        );
    }

    async getAssetPriceHistoryChart(
        portfolioId: string,
        userId: string,
        asset: string,
        startDate: Date,
        endDate: Date,
        resolution: "hourly" | "daily",
    ) {
        return this.portfolioRepository.findAssetPriceHistory(
            portfolioId,
            userId,
            asset,
            startDate,
            endDate,
            resolution,
        );
    }

    async getAssetPerformance(
        portfolioId: string,
        userId: string,
        startDate: Date,
        endDate: Date,
    ) {
        return this.portfolioRepository.findBestPerformingAsset(
            portfolioId,
            userId,
            startDate,
            endDate,
        );
    }

    async getAssetAllocation(
        portfolioId: string,
        userId: string,
    ) {
        const assets = await this.portfolioAssetService.getAllocation(
            portfolioId,
            userId,
        );

        if (!assets) {
            throw new Error(
                `No assets found for portfolio with ID ${portfolioId}`,
            );
        }

        return assets;
    }

    async getAssets(
        id: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        return this.portfolioAssetService.getByPortfolioIdPaginated(
            id,
            userId,
            pageOptionsDto,
        );
    }

    async getTransactions(
        id: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        return this.transactionRepository.findByPortfolioIdPaginated(
            id,
            userId,
            pageOptionsDto,
        );
    }

    async sync(id: string, userId: string) {
        const portoflio = await this.portfolioRepository.findByIdAndUser(
            id,
            userId,
        );

        return this.portfolioSyncService.enqueueSyncJob(portoflio);
    }

    async getAll() {
        return this.portfolioRepository.findAll();
    }

    async findByUserId(userId: string) {
        return this.portfolioRepository.findByUser(userId);
    }

    async getStatus(id: string, userId: string) {
        const portfolio = await this.portfolioRepository.findByIdAndUser(
            id,
            userId,
        );
        return {
            status: portfolio.status,
        };
    }

    async getById(id: string, userId: string) {
        const port = await this.portfolioRepository.findByIdAndUser(
            id,
            userId,
        );

        return port;
    }

    async create(createPortfolioDto: CreatePortfolioDto, userId: string) {
        const portfolio = await this.portfolioRepository.insert({
            api_key: createPortfolioDto.apiKey,
            connection_name: createPortfolioDto.connection,
            title: createPortfolioDto.title,
            color: createPortfolioDto.color,
            user_id: userId,
        });

        await this.portfolioSyncService.enqueueSyncJob(portfolio);

        return portfolio;
    }

    async update(
        id: string,
        updatePortfolioDto: UpdatePortfolioDto,
        userId: string,
    ) {
        const portfolio = await this.portfolioRepository.updateById(id, {
            api_key: updatePortfolioDto.apiKey,
            connection_name: updatePortfolioDto.connection,
            title: updatePortfolioDto.title,
            color: updatePortfolioDto.color,
            user_id: userId,
        });

        await this.portfolioSyncService.enqueueSyncJob(portfolio);

        return portfolio;
    }

    async remove(id: string, userId: string) {
        return this.portfolioRepository.deleteById(id, userId);
    }

    async updateStatusById(
        portfolioId: string,
        userId: string,
        status: Portfolio["status"],
    ) {
        return this.portfolioRepository.updateStatusById(
            portfolioId,
            userId,
            status,
        );
    }

    async isOwner(
        portfolioId: string,
        userId: string,
    ): Promise<boolean> {
        return this.portfolioRepository.isOwner(portfolioId, userId);
    }

    async getUnsynced(minutes: number): Promise<Portfolio[]> {
        return this.portfolioRepository.findUnsynced(minutes);
    }

    private async getPortfolioIds(
        id: string,
        userId: string,
        type: PortfolioType,
    ): Promise<string | string[]> {
        if (type === "group") {
            const portfolios = await this.portfolioGroupService.getById(
                id,
                userId,
            );
            return portfolios.map((portfolio) => portfolio.id);
        }

        return id;
    }
}
