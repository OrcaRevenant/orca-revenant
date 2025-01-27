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

    async getHistoricalPortfolioBalance(
        portfolioId: string,
        startDate: Date,
        endDate: Date,
        resolution: "hourly" | "daily",
    ) {
        return this.portfolioRepository.getHistoricalBalance(
            portfolioId,
            startDate,
            endDate,
            resolution,
        );
    }

    async calculatePortfolioBalance(
        portfolioId: string,
        userId: string,
    ) {
        const assets = await this.portfolioRepository.findAllPortfolioAssets(
            portfolioId,
            userId,
        );

        if (!assets) {
            throw new Error(
                `No assets found for portfolio with ID ${portfolioId}`,
            );
        }

        // TODO: instead of adding with 0 it should multiply with price of that asset
        const balance = assets.reduce((sum) => {
            return sum + 0;
        }, 0);

        return {
            balance,
        };
    }

    async calculateAssetAllocation(
        portfolioId: string,
        userId: string,
    ) {
        const assets = await this.portfolioRepository.findAllPortfolioAssets(
            portfolioId,
            userId,
        );

        if (!assets) {
            throw new Error(
                `No assets found for portfolio with ID ${portfolioId}`,
            );
        }

        const totalValue = assets.reduce((sum, asset) => {
            return sum + asset.amount;
        }, 0);

        if (totalValue === 0) {
            throw new Error(`Total portfolio value is zero.`);
        }

        const allocation = assets.map((asset) => {
            const percentage = (asset.amount / totalValue) * 100;
            return {
                asset: asset.asset,
                percentage: parseFloat(percentage.toFixed(2)),
            };
        });

        return allocation;
    }

    async findUserPortfolioAssets(
        id: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        return this.portfolioRepository.findPortfolioAssets(
            id,
            userId,
            pageOptionsDto,
        );
    }

    async findUserPortfolioTransactions(
        id: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        return this.transactionRepository.findAllByPortfolioId(
            id,
            userId,
            pageOptionsDto,
        );
    }

    async sync(id: string, userId: string) {
        const portoflio = await this.portfolioRepository.findOneByUserId(
            id,
            userId,
        );

        return this.portfolioSyncService.enqueueSyncJob(portoflio);
    }

    async findAll() {
        return this.portfolioRepository.findAll();
    }

    async findByUserId(userId: string) {
        return this.portfolioRepository.findByUserId(userId);
    }

    async getStatus(id: string, userId: string) {
        const portfolio = await this.portfolioRepository.findOneByUserId(
            id,
            userId,
        );
        return portfolio.status;
    }

    async findOneByUserId(id: string, userId: string) {
        const port = await this.portfolioRepository.findOneByUserId(
            id,
            userId,
        );

        return port;
    }

    async create(createPortfolioDto: CreatePortfolioDto, userId: string) {
        const portfolio = await this.portfolioRepository.create({
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
        const portfolio = await this.portfolioRepository.update(id, {
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
        return this.portfolioRepository.delete(id, userId);
    }

    async isPortfolioOwner(
        portfolioId: string,
        userId: string,
    ): Promise<boolean> {
        return this.portfolioRepository.isPortfolioOwner(portfolioId, userId);
    }
}
