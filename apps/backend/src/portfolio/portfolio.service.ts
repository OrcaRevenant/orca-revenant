import { Injectable } from "@nestjs/common";
import { PortfolioRepository } from "./portfolio.repository";
import { UpdatePortfolio } from "./portfolio.types";
import { CreatePortfolioDto, UpdatePortfolioDto } from "./dto";

@Injectable()
export class PortfolioService {
    constructor(private readonly portfolioRepository: PortfolioRepository) {}

    async findAll(userId: string) {
        return this.portfolioRepository.findByUserId(userId);
    }

    async findOne(id: string, userId: string) {
        return this.portfolioRepository.findOneByUserId(id, userId);
    }

    async create(createPortfolioDto: CreatePortfolioDto, userId: string) {
        return this.portfolioRepository.create({
            api_key: createPortfolioDto.apiKey,
            connection_name: createPortfolioDto.connection,
            title: createPortfolioDto.title,
            color: createPortfolioDto.color,
            user_id: userId,
        });
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
