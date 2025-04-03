import { Injectable } from "@nestjs/common";
import { PortfolioGroupRepository } from "./portfolio-group.repository";
import {
  PortfolioGroupUniqueIdentifier,
  PortfolioGroup,
  PortfolioGroupTree,
} from "./portfolio-group.types";
import { PortfolioRepository } from "../portfolio.repository";
import { PopulatedPortfolio, Portfolio } from "../portfolio.types";
import { PriceConversionService } from "@/price/price-conversion.service";

@Injectable()
export class PortfolioGroupService {
  constructor(
    private readonly portfolioGroupRepository: PortfolioGroupRepository,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly priceConversionService: PriceConversionService
  ) {}

  async getById(groupId: PortfolioGroupUniqueIdentifier, userId: string) {
    return this.portfolioGroupRepository.findByIdAndUser(groupId, userId);
  }

  async getAllPopulated(userId: string, quote: string = "usdt") {
    const groups = await this.portfolioGroupRepository.findByUser(userId);
    const portfolios = await this.portfolioRepository.findByUser(userId);

    const populatedPortfolios =
      await this.portfolioRepository.populatePortfolio(
        portfolios as Portfolio[]
      );

    const conversionRate =
      await this.priceConversionService.getConversionRate(quote);

    const tree = this.buildPortfolioTree(
      groups,
      populatedPortfolios,
      conversionRate,
      null
    );

    // We don't need to convert the stats because we convert the total value in the tree
    const stats = this.calculateGroupStats(tree);

    return {
      groups: tree,
      stats: {
        total_value: stats.totalValue,
        total_portfolios: stats.totalPortfolios,
        unique_assets: stats.uniqueAssets,
      },
    };
  }

  private calculateGroupStats(
    items: PortfolioGroupTree = [],
    conversionRate: number = 1
  ): {
    totalValue: number;
    uniqueAssets: Set<string>;
    totalPortfolios: number;
  } {
    const stats = items.reduce(
      (acc, item) => {
        if (item.type === "portfolio") {
          item.assets?.forEach((asset) => acc.uniqueAssets.add(asset));
          return {
            totalValue: acc.totalValue + (item.value || 0),
            uniqueAssets: acc.uniqueAssets,
            totalPortfolios: acc.totalPortfolios + 1,
          };
        } else if (item.type === "group") {
          const childStats = this.calculateGroupStats(
            item.children,
            conversionRate
          );
          childStats.uniqueAssets.forEach((asset) =>
            acc.uniqueAssets.add(asset)
          );
          return {
            totalValue: acc.totalValue + childStats.totalValue,
            uniqueAssets: acc.uniqueAssets,
            totalPortfolios: acc.totalPortfolios + childStats.totalPortfolios,
          };
        }
        return acc;
      },
      {
        totalValue: 0,
        uniqueAssets: new Set<string>(),
        totalPortfolios: 0,
      }
    );

    return {
      totalValue: stats.totalValue / conversionRate,
      uniqueAssets: stats.uniqueAssets,
      totalPortfolios: stats.totalPortfolios,
    };
  }

  private buildPortfolioTree(
    groups: PortfolioGroup[],
    portfolios: PopulatedPortfolio[],
    conversionRate: number,
    parentId: PortfolioGroupUniqueIdentifier | null
  ): PortfolioGroupTree {
    const items: PortfolioGroupTree = [];
    const currentLevelGroups = groups.filter((g) => g.parent_id === parentId);

    for (const group of currentLevelGroups) {
      const children = this.buildPortfolioTree(
        groups,
        portfolios,
        conversionRate,
        group.id as unknown as string
      );

      const stats = this.calculateGroupStats(children || [], conversionRate);

      items.push({
        ...group,
        children,
        total_value: stats.totalValue / conversionRate,
        unique_assets: stats.uniqueAssets,
        total_portfolios: stats.totalPortfolios,
        type: "group",
      });
    }

    const currentLevelPortfolios = portfolios.filter(
      (p) => p.group_id === parentId
    );

    for (const portfolio of currentLevelPortfolios) {
      items.push({
        ...portfolio,
        value: portfolio.value / conversionRate,
        type: "portfolio",
      });
    }

    return items;
  }
}
