import { Injectable } from "@nestjs/common";
import { PortfolioGroupRepository } from "./portfolio-group.repository";
import {
  PortfolioGroupUniqueIdentifier,
  PortfolioGroup,
  PortfolioGroupTree,
} from "./portfolio-group.types";
import { PortfolioRepository } from "../portfolio.repository";
import { PopulatedPortfolio, Portfolio } from "../portfolio.types";

@Injectable()
export class PortfolioGroupService {
  constructor(
    private readonly portfolioGroupRepository: PortfolioGroupRepository,
    private readonly portfolioRepository: PortfolioRepository
  ) {}

  async getById(groupId: PortfolioGroupUniqueIdentifier, userId: string) {
    return this.portfolioGroupRepository.findByIdAndUser(groupId, userId);
  }

  async getAllPopulated(userId: string) {
    const groups = await this.portfolioGroupRepository.findByUser(userId);
    const portfolios = await this.portfolioRepository.findByUser(userId);

    const populatedPortfolios =
      await this.portfolioRepository.populatePortfolio(
        portfolios as Portfolio[]
      );

    const tree = this.buildPortfolioTree(groups, populatedPortfolios, null);
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

  private calculateGroupStats(items: PortfolioGroupTree = []): {
    totalValue: number;
    uniqueAssets: Set<string>;
    totalPortfolios: number;
  } {
    return items.reduce(
      (acc, item) => {
        if (item.type === "portfolio") {
          item.assets?.forEach((asset) => acc.uniqueAssets.add(asset));
          return {
            totalValue: acc.totalValue + (item.value || 0),
            uniqueAssets: acc.uniqueAssets,
            totalPortfolios: acc.totalPortfolios + 1,
          };
        } else if (item.type === "group") {
          const childStats = this.calculateGroupStats(item.children);
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
  }

  private buildPortfolioTree(
    groups: PortfolioGroup[],
    portfolios: PopulatedPortfolio[],
    parentId: PortfolioGroupUniqueIdentifier | null
  ): PortfolioGroupTree {
    const items: PortfolioGroupTree = [];
    const currentLevelGroups = groups.filter((g) => g.parent_id === parentId);

    for (const group of currentLevelGroups) {
      const children = this.buildPortfolioTree(
        groups,
        portfolios,
        group.id as unknown as string
      );

      const stats = this.calculateGroupStats(children || []);

      items.push({
        ...group,
        children,
        total_value: stats.totalValue,
        unique_assets: stats.uniqueAssets,
        total_portfolios: stats.totalPortfolios,
        type: "group",
      });
    }

    const currentLevelPortfolios = portfolios.filter(
      (p) => p.group_id === parentId
    );

    for (const portfolio of currentLevelPortfolios) {
      items.push({ ...portfolio, type: "portfolio" });
    }

    return items;
  }
}
