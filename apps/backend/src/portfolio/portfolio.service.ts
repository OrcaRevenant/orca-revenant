import { Injectable } from "@nestjs/common";
import { PortfolioRepository } from "./portfolio.repository";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./dto";
import { PortfolioSyncService } from "@/portfolio-sync/portfolio-sync.service";

@Injectable()
export class PortfolioService {
    constructor(
        private readonly portfolioRepository: PortfolioRepository,
        private readonly portfolioSyncService: PortfolioSyncService,
    ) {}

    async findAll(userId: string) {
        return this.portfolioRepository.findByUserId(userId);
    }

    async findOne(id: string, userId: string) {
        return this.portfolioRepository.findOneByUserId(id, userId);
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
        return this.portfolioRepository.update(id, {
            api_key: updatePortfolioDto.apiKey,
            connection_name: updatePortfolioDto.connection,
            title: updatePortfolioDto.title,
            color: updatePortfolioDto.color,
            user_id: userId,
        });
    }

    async remove(id: string, userId: string) {
        return this.portfolioRepository.delete(id, userId);
    }
}
