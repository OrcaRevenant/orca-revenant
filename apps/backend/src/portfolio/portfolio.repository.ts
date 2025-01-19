import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UniqueIdentifier } from "@/connection/connection.abstract";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";
import { Portfolio, PortfolioAsset } from "./portfolio.types";
import { DatabaseService } from "@/database/database.service";

@Injectable()
export class PortfolioRepository {
    private readonly table = "portfolio";

    constructor(private readonly db: DatabaseService) {}

    private serialize(portfolio: any): Portfolio {
        return {
            api_key: portfolio.api_key,
            connection_name: portfolio.connection_name,
            created_at: portfolio.created_at,
            disabled: !!portfolio.disabled,
            id: `${portfolio.id}`,
            last_sync_at: portfolio.last_sync_at,
            title: portfolio.title,
            user_id: `${portfolio.user_id}`,
            color: `${portfolio.color}`,
            status: portfolio.status,
        };
    }

    private serializeAssets(portfolioAsset: any): PortfolioAsset {
        return {
            amount: portfolioAsset.amount,
            asset: portfolioAsset.asset,
            portfolio_id: portfolioAsset.portfolio_id,
        };
    }

    async create(payload: Partial<Portfolio>): Promise<Portfolio> {
        const result = await this.db.query
            .insertInto(this.table)
            .values(payload)
            .returningAll()
            .executeTakeFirst();

        if (!result) {
            throw new Error("Error creating portfolio");
        }
        return this.serialize(result);
    }

    async update(
        id: UniqueIdentifier,
        payload: Partial<Portfolio>,
    ): Promise<Portfolio> {
        const result = await this.db.query
            .updateTable(this.table)
            .set(payload)
            .where("id", "=", `${id}`)
            .where("user_id", "=", payload.user_id)
            .returningAll()
            .executeTakeFirst();

        if (!result) {
            throw new Error("Error updating portfolio");
        }

        return this.serialize(result);
    }

    async delete(
        id: UniqueIdentifier,
        userId: UniqueIdentifier,
    ): Promise<boolean> {
        const result = await this.db.query
            .deleteFrom(this.table)
            .where("id", "=", `${id}`)
            .where("user_id", "=", `${userId}`)
            .returning("id")
            .executeTakeFirst();

        if (!result) {
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
        }
        return true;
    }

    async findByUserId(userId: UniqueIdentifier): Promise<Portfolio[]> {
        const results = await this.db.query
            .selectFrom(this.table)
            .selectAll()
            .where("user_id", "=", `${userId}`)
            .execute();

        return results.map(this.serialize);
    }

    async findAll(): Promise<Portfolio[]> {
        const results = await this.db.query
            .selectFrom(this.table)
            .selectAll()
            .execute();

        return results.map(this.serialize);
    }

    async findOneByUserId(
        id: UniqueIdentifier,
        userId: UniqueIdentifier,
    ): Promise<Portfolio> {
        const result = await this.db.query
            .selectFrom(this.table)
            .selectAll()
            .where("id", "=", `${id}`)
            .where("user_id", "=", `${userId}`)
            .executeTakeFirst();

        if (!result) {
            throw new Error("Portfolio not found");
        }
        return this.serialize(result);
    }

    async updateStatus(
        portfolio: Portfolio,
        status: Portfolio["status"],
    ): Promise<Portfolio> {
        const result = await this.db.query
            .updateTable(this.table)
            .set({
                status,
                last_sync_at: new Date().toISOString(),
            })
            .where("id", "=", portfolio.id)
            .where("user_id", "=", portfolio.user_id)
            .returningAll()
            .executeTakeFirst();

        if (!result) {
            throw new Error("Error updating portfolio status");
        }
        return this.serialize(result);
    }

    async isPortfolioOwner(
        portfolioId: UniqueIdentifier,
        userId: UniqueIdentifier,
    ): Promise<boolean> {
        const result = await this.db.query
            .selectFrom(this.table)
            .select(["id", "user_id"])
            .where("id", "=", `${portfolioId}`)
            .executeTakeFirst();

        return result?.user_id === userId || false;
    }

    async findUnsyncedPortfolios(minutes: number): Promise<Portfolio[]> {
        const thresholdTime = new Date(Date.now() - minutes * 60 * 1000)
            .toISOString();

        const results = await this.db.query
            .selectFrom(this.table)
            .selectAll()
            .where((qb) =>
                qb.or([
                    qb("last_sync_at", "is", null),
                    qb("last_sync_at", "<", thresholdTime as any),
                ])
            )
            .execute();

        return results.map(this.serialize);
    }

    async createManyPortfolioAssets(
        assets: PortfolioAsset[],
    ): Promise<boolean> {
        await this.db.query
            .insertInto("portfolio_assets")
            .values(assets)
            .onConflict((oc) =>
                oc.columns(["asset", "portfolio_id"]).doUpdateSet({
                    asset: (eb) => eb.ref("excluded.asset"),
                })
            )
            .execute();

        return true;
    }

    async findPortfolioAssets(
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ): Promise<PageDto<PortfolioAsset>> {
        const { limit, skip } = pageOptionsDto;

        const results = await this.db.query
            .selectFrom("portfolio_assets")
            .innerJoin(
                "portfolio",
                "portfolio.id",
                "portfolio_assets.portfolio_id",
            )
            .innerJoin("asset", "asset.symbol", "portfolio_assets.asset")
            .selectAll("portfolio_assets")
            .select(["asset.symbol", "asset.name", "asset.logo"])
            .select((eb) =>
                eb
                    .selectFrom("portfolio_assets")
                    .innerJoin(
                        "portfolio",
                        "portfolio.id",
                        "portfolio_assets.portfolio_id",
                    )
                    .where("portfolio_assets.portfolio_id", "=", portfolioId)
                    .where("portfolio.user_id", "=", userId)
                    .select((subEb) => subEb.fn.countAll().as("count"))
                    .as("total_count")
            )
            .where("portfolio_assets.portfolio_id", "=", portfolioId)
            .where("portfolio.user_id", "=", userId)
            .limit(limit)
            .offset(skip)
            .execute();

        const totalCount = results.length > 0
            ? Number(results[0].total_count)
            : 0;

        const pageMetaDto = new PageMetaDto({
            itemCount: totalCount,
            pageOptionsDto,
        });

        return new PageDto<PortfolioAsset>(
            results.map(this.serializeAssets),
            pageMetaDto,
        );
    }

    async findAllPortfolioAssets(
        portfolioId: string,
        userId: string,
    ): Promise<PortfolioAsset[]> {
        const results = await this.db.query
            .selectFrom("portfolio_assets")
            .innerJoin(
                "portfolio",
                "portfolio.id",
                "portfolio_assets.portfolio_id",
            )
            .innerJoin("asset", "asset.symbol", "portfolio_assets.asset")
            .selectAll("portfolio_assets")
            .select(["asset.symbol", "asset.name", "asset.logo"])
            .where("portfolio_assets.portfolio_id", "=", portfolioId)
            .where("portfolio.user_id", "=", userId)
            .execute();

        return results.map(this.serializeAssets);
    }
}
