import { Injectable } from "@nestjs/common";
import { PortfolioRepository } from "./portfolio.repository";
import { CreatePortfolio, UpdatePortfolio } from "./portfolio.types";

@Injectable()
export class PortfolioService {
    constructor(private readonly portfolioRepository: PortfolioRepository) {}

    async getAllByUserId(userId: string) {
        return this.portfolioRepository.findByUserId(userId);
    }

    async getOneByUserId(id: string, userId: string) {
        return this.portfolioRepository.findOneByUserId(id, userId);
    }

    async create(portfolio: CreatePortfolio) {
        return this.portfolioRepository.create(portfolio);
    }

    async update(id: string, portfolio: UpdatePortfolio) {
        return this.portfolioRepository.update(id, portfolio);
    }

    async delete(id: string, userId: string) {
        return this.portfolioRepository.delete(id, userId);
    }
}
