import { Injectable } from "@nestjs/common";
import { PortfolioAssetRepository } from "./portfolio-asset.repository";
import { PortfolioAsset } from "./portfolio-asset.types";
import { PageOptionsDto } from "@/pagination/dto";

@Injectable()
export class PortfolioAssetService {
  constructor(
    private readonly portfolioAssetRepository: PortfolioAssetRepository
  ) {}

  async insert(assets: PortfolioAsset[]) {
    return this.portfolioAssetRepository.insert(assets);
  }

  async getAllByPortfolioId(portfolioIds: string | string[], userId: string) {
    const calculationFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.portfolioAssetRepository.findAllByPortfolioId(
      portfolioIds,
      userId,
      calculationFrom.toISOString()
    );
  }
  async getByPortfolioIdPaginated(
    id: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto
  ) {
    const calculationFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.portfolioAssetRepository.findAllByPortfolioIdPaginated(
      id,
      userId,
      pageOptionsDto,
      calculationFrom.toISOString()
    );
  }

  async getAllocation(id: string | string[], userId: string) {
    return this.portfolioAssetRepository.findAssetAllocation(id, userId);
  }
}
