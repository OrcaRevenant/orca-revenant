import { Injectable } from "@nestjs/common";
import { PortfolioGroupRepository } from "./portfolio-group.repository";
import { GroupUniqueIdentifier } from "./portfolio-group.types";

@Injectable()
export class PortfolioGroupService {
    constructor(
        private readonly portfolioGroupRepository: PortfolioGroupRepository,
    ) {}

    async getById(
        groupId: GroupUniqueIdentifier,
        userId: string,
    ) {
        return this.portfolioGroupRepository.findById(
            groupId,
            userId,
        );
    }

    async getAll(userId: string) {
        const { global_stats, groups, portfolios } = await this
            .portfolioGroupRepository.findAll(userId);

        const tree = this.buildPortfolioTree(
            groups,
            portfolios,
            null,
        );

        return {
            groups: tree,
            stats: {
                total_value: Number(global_stats.total_value) || 0,
                total_unique_assets: global_stats.total_unique_assets || 0,
                total_portfolios: global_stats.total_portfolios || 0,
            },
        };
    }

    private calculateGroupStats(
        items: any[],
    ): {
        totalValue: number;
        uniqueAssets: Set<string>;
        totalPortfolios: number;
    } {
        return items.reduce((acc, item) => {
            if (item.type === "portfolio") {
                item.assets?.forEach((asset) => acc.uniqueAssets.add(asset));
                return {
                    totalValue: acc.totalValue + (item.stats.value || 0),
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
                    totalPortfolios: acc.totalPortfolios +
                        childStats.totalPortfolios,
                };
            }
            return acc;
        }, {
            totalValue: 0,
            uniqueAssets: new Set<string>(),
            totalPortfolios: 0,
        });
    }

    private buildPortfolioTree(
        groups: any[],
        portfolios: any[],
        parentId: number | null,
    ) {
        const items: any[] = [];

        // Add groups at current level
        const currentLevelGroups = groups.filter((g) =>
            g.parent_id === parentId
        );
        for (const group of currentLevelGroups) {
            const children = this.buildPortfolioTree(
                groups,
                portfolios,
                group.id,
            );
            const groupStats = this.calculateGroupStats(children);

            const groupItem: any = {
                id: group.id,
                title: group.title,
                color: group.color,
                type: "group",
                children,
                total_value: groupStats.totalValue,
                unique_asset_count: groupStats.uniqueAssets.size,
                total_portfolios: groupStats.totalPortfolios,
            };
            items.push(groupItem);
        }

        // Add portfolios at current level
        const currentLevelPortfolios = portfolios.filter((p) =>
            p.group_id === parentId
        );
        for (const portfolio of currentLevelPortfolios) {
            const portfolioItem: any = {
                id: portfolio.id,
                title: portfolio.title,
                color: portfolio.color,
                type: "portfolio",
                connection_name: portfolio.connection_name,
                status: portfolio.status,
                disabled: portfolio.disabled,
                assets: portfolio.assets || [],
                value: Number(portfolio.value) || 0,
                asset_count: Number(portfolio.asset_count) || 0,
            };
            items.push(portfolioItem);
        }

        return items;
    }
}
