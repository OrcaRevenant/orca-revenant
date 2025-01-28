import { Injectable } from "@nestjs/common";
import { PortfolioRepository } from "./portfolio.repository";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./dto";
import { PortfolioSyncService } from "@/portfolio/portfolio-sync/portfolio-sync.service";
import { TransactionRepository } from "@/transaction/transaction.repository";
import { PageOptionsDto } from "@/pagination/dto";

@Injectable()
export class PortfolioService {
    constructor(
        private readonly portfolioRepository: PortfolioRepository,
        private readonly portfolioSyncService: PortfolioSyncService,
        private readonly transactionRepository: TransactionRepository,
    ) {
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

    async getBalance(
        portfolioId: string,
        userId: string,
    ) {
        const balance = await this.portfolioRepository.findPortfolioBalance(
            portfolioId,
            userId,
        );

        return {
            balance,
        };
    }

    async getAssetAllocation(
        portfolioId: string,
        userId: string,
    ) {
        const assets = await this.portfolioRepository.findPortfolioAssets(
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
        return this.portfolioRepository.findAssetsPaginated(
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
        return portfolio.status;
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

    async isOwner(
        portfolioId: string,
        userId: string,
    ): Promise<boolean> {
        return this.portfolioRepository.isOwner(portfolioId, userId);
    }
}
