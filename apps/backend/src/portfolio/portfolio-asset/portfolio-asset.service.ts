import { Injectable } from "@nestjs/common";
import { PortfolioAssetRepository } from "./portfolio-asset.repository";
import { PortfolioAsset } from "./portfolio-asset.types";
import { PageOptionsDto } from "@/pagination/dto";

@Injectable()
export class PortfolioAssetService {
    constructor(
        private readonly portfolioAssetRepository: PortfolioAssetRepository,
    ) {}

    async insert(assets: PortfolioAsset[]) {
        return this.portfolioAssetRepository.insert(assets);
    }

    async getByPortfolioIdPaginated(
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        return this.portfolioAssetRepository.findByPortfolioIdPaginated(
            portfolioId,
            userId,
            pageOptionsDto,
        );
    }

    async getAllocation(
        portfolioId: string,
        userId: string,
    ) {
        return this.portfolioAssetRepository.findAllocation(
            portfolioId,
            userId,
        );
    }
}
