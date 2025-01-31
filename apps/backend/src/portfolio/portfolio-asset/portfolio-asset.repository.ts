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
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ): Promise<PageDto<PortfolioAsset>> {
        const { limit, skip } = pageOptionsDto;

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
                WITH paginated_assets AS (
                    SELECT 
                        pa.*,
                        a.symbol,
                        a.name,
                        a.logo,
                        p.price as price_per_unit,
                        (pa.amount * p.price) as value,
                        COUNT(*) OVER() as total_count
                    FROM portfolio_assets pa
                    INNER JOIN portfolio pf ON pf.id = pa.portfolio_id
                    INNER JOIN asset a ON a.symbol = pa.asset
                    LEFT JOIN LATERAL (
                        SELECT price
                        FROM price
                        WHERE asset = pa.asset
                        ORDER BY time DESC
                        LIMIT 1
                    ) p ON true
                    WHERE pa.portfolio_id = ${portfolioId}
                    AND pf.user_id = ${userId}
                    ORDER BY (pa.amount * p.price) DESC
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
                FROM paginated_assets
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
        portfolioId: string,
        userId: string,
    ) {
        const records = await sql`
            WITH portfolio_with_prices AS (
            SELECT 
                pa.asset,
                pa.amount,
                a.name,
                a.logo,
                a.alt_names,
                p.price as price_per_unit,
                (pa.amount * p.price) as value
            FROM portfolio_assets pa
            INNER JOIN asset a ON a.symbol = pa.asset
            INNER JOIN portfolio pf ON pf.id = pa.portfolio_id
            LEFT JOIN LATERAL (
                SELECT price
                FROM price
                WHERE asset = pa.asset
                ORDER BY time DESC
                LIMIT 1
            ) p ON true
            WHERE pa.portfolio_id = ${portfolioId}
            AND pf.user_id = ${userId}
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
            percentage: Number(row.allocation_percentage),
        }));

        return assets;
    }
}
