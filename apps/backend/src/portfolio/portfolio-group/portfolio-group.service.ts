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
import { PortfolioItemsOrderRepository } from "./portfolio-items-order.repository";
import { ReorderItemsDto } from "./portfolio-items-reorder.dto";
@Injectable()
export class PortfolioGroupService {
  constructor(
    private readonly portfolioGroupRepository: PortfolioGroupRepository,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly priceConversionService: PriceConversionService,
    private readonly portfolioItemsOrderRepository: PortfolioItemsOrderRepository
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

    const tree = await this.buildPortfolioTree(
      groups,
      populatedPortfolios,
      conversionRate,
      null,
      userId
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

  private async buildPortfolioTree(
    groups: PortfolioGroup[],
    portfolios: PopulatedPortfolio[],
    conversionRate: number,
    parentId: PortfolioGroupUniqueIdentifier | null,
    userId: string
  ): Promise<PortfolioGroupTree> {
    const items: PortfolioGroupTree = [];
    const currentLevelGroups = groups.filter((g) => g.parent_id === parentId);
    const currentLevelPortfolios = portfolios.filter(
      (p) => p.group_id === parentId
    );

    const orderItems =
      await this.portfolioItemsOrderRepository.getOrder(userId);
    const orderMap = new Map(
      orderItems.map((item) => [`${item.type}-${item.id}`, item.order])
    );

    const allItems = [
      ...currentLevelGroups.map((group) => ({
        item: group,
        type: "group" as const,
      })),
      ...currentLevelPortfolios.map((portfolio) => ({
        item: portfolio,
        type: "portfolio" as const,
      })),
    ].sort((a, b) => {
      const aOrder =
        orderMap.get(`${a.type}-${a.item.id}`) ?? Number.MAX_SAFE_INTEGER;
      const bOrder =
        orderMap.get(`${b.type}-${b.item.id}`) ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });

    for (const { item, type } of allItems) {
      if (type === "group") {
        const children = await this.buildPortfolioTree(
          groups,
          portfolios,
          conversionRate,
          item.id as unknown as string,
          userId
        );

        const stats = this.calculateGroupStats(children || [], conversionRate);

        items.push({
          ...item,
          children,
          total_value: stats.totalValue / conversionRate,
          unique_assets: stats.uniqueAssets,
          total_portfolios: stats.totalPortfolios,
          type: "group",
        });
      } else {
        items.push({
          ...item,
          value: item.value / conversionRate,
          type: "portfolio",
        });
      }
    }

    return items;
  }

  async reorderItems(userId: string, dto: ReorderItemsDto): Promise<void> {
    await this.portfolioItemsOrderRepository.updateOrder(userId, dto.items);
  }
}
