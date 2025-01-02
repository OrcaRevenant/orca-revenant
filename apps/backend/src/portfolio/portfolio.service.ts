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

    async findUserPortfolioTransactions(
        id: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        return await this.transactionRepository.findAllByPortfolioId(
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

    async findOneByUserId(id: string, userId: string) {
        return this.portfolioRepository.findOneByUserId(
            id,
            userId,
        );
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
