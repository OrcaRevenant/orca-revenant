import { DatabaseService } from "@/database/database.service";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";
import { Injectable } from "@nestjs/common";
import {
    PopulatedPortfolioAsset,
    PortfolioAsset,
} from "./portfolio-asset.types";
import { sql } from "kysely";

@Injectable()
export class PortfolioAssetRepository {
    constructor(private readonly db: DatabaseService) {}

    async insert(
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

    private serialize(result: any): PopulatedPortfolioAsset {
        return {
            amount: result.amount,
            asset: result.asset,
            portfolio_id: result.portfolio_id,
            value: result.value,
            price_per_unit: result.price_per_unit,
        };
    }

    async findByPortfolioIdPaginated(
        portfolioIds: string | string[],
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ): Promise<PageDto<PortfolioAsset>> {
        const { limit, skip } = pageOptionsDto;
        const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

        const results = await sql<{
            asset: string;
            amount: string;
            symbol: string;
            name: string;
            logo: string;
            price_per_unit: string;
            value: string;
            total_count: number;
        }>`
            WITH authorized_portfolios AS (
                -- First verify ownership of all portfolios
                SELECT id
                FROM portfolio
                WHERE id = ANY(${ids})
                AND user_id = ${userId}
            ),
            aggregated_assets AS (
                -- Aggregate assets across portfolios
                SELECT 
                    pa.asset,
                    SUM(pa.amount) as amount,
                    a.symbol,
                    a.name,
                    a.logo,
                    p.price as price_per_unit,
                    SUM(pa.amount * p.price) as value
                FROM portfolio_assets pa
                INNER JOIN authorized_portfolios ap ON pa.portfolio_id = ap.id
                INNER JOIN asset a ON a.symbol = pa.asset
                LEFT JOIN LATERAL (
                    SELECT price
                    FROM price
                    WHERE asset = pa.asset
                    ORDER BY time DESC
                    LIMIT 1
                ) p ON true
                GROUP BY 
                    pa.asset,
                    a.symbol,
                    a.name,
                    a.logo,
                    p.price
            ),
            counted_assets AS (
                -- Add row count for pagination
                SELECT 
                    *,
                    COUNT(*) OVER() as total_count
                FROM aggregated_assets
                ORDER BY value DESC
                LIMIT ${limit}
                OFFSET ${skip}
            )
            SELECT 
                asset,
                amount::text,
                symbol,
                name,
                logo,
                price_per_unit::text,
                value::text,
                total_count::integer
            FROM counted_assets;
        `.execute(this.db.query);

        const totalCount = results.rows.length > 0
            ? Number(results.rows[0].total_count)
            : 0;

        const pageMetaDto = new PageMetaDto({
            itemCount: totalCount,
            pageOptionsDto,
        });

        return new PageDto<PortfolioAsset>(
            results.rows.map((v) =>
                this.serialize({
                    ...v,
                    asset: {
                        symbol: v.symbol,
                        logo: v.logo,
                        name: v.name,
                    },
                    value: Number(v.value),
                    price_per_unit: Number(v.price_per_unit),
                })
            ),
            pageMetaDto,
        );
    }

    async findAllocation(
        portfolioIds: string | string[],
        userId: string,
    ) {
        const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

        const records = await sql`
            WITH authorized_portfolios AS (
                -- Verify ownership of all portfolios
                SELECT id
                FROM portfolio
                WHERE id = ANY(${ids})
                AND user_id = ${userId}
            ),
            portfolio_with_prices AS (
                SELECT 
                    pa.asset,
                    SUM(pa.amount) as amount,
                    a.name,
                    a.logo,
                    a.alt_names,
                    p.price as price_per_unit,
                    SUM(pa.amount * p.price) as value
                FROM portfolio_assets pa
                INNER JOIN authorized_portfolios ap ON pa.portfolio_id = ap.id
                INNER JOIN asset a ON a.symbol = pa.asset
                LEFT JOIN LATERAL (
                    SELECT price
                    FROM price
                    WHERE asset = pa.asset
                    ORDER BY time DESC
                    LIMIT 1
                ) p ON true
                GROUP BY 
                    pa.asset,
                    a.name,
                    a.logo,
                    a.alt_names,
                    p.price
            )
            SELECT 
                pwp.asset as symbol,
                pwp.name,
                pwp.logo,
                pwp.alt_names,
                pwp.amount::text,
                pwp.price_per_unit::text,
                pwp.value::text,
                (pwp.value / NULLIF(SUM(pwp.value) OVER (), 0) * 100)::text as allocation_percentage
            FROM portfolio_with_prices pwp
            ORDER BY pwp.value DESC;
        `.execute(this.db.query);

        const assets = records.rows.map((row: any) => ({
            asset: {
                symbol: row.symbol,
                name: row.name,
                logo: row.logo,
            },
            amount: Number(row.amount),
            value: Number(row.value),
            percentage: Number(row.allocation_percentage),
        }));

        return assets;
    }
}
