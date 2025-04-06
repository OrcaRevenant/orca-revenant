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

  private serialize(result: any): PopulatedPortfolioAsset {
    return {
      amount: result.amount,
      asset: result.asset,
      portfolio_id: result.portfolio_id,
      value: result.value,
      price_per_unit: result.price_per_unit,
      pnl: result.pnl || 0,
      pnl_percentage: result.pnl_percentage || 0,
      price_at_calculation: result.price_at_calculation,
      change: result.change,
      change_percentage: result.change_percentage,
    };
  }

  async insert(assets: PortfolioAsset[]): Promise<boolean> {
    await this.db.query
      .insertInto("portfolio_assets")
      .values(assets)
      .onConflict((oc) =>
        oc.columns(["asset", "portfolio_id"]).doUpdateSet({
          amount: (eb) => eb.ref("excluded.amount"),
        })
      )
      .execute();

    return true;
  }

  async findByPortfolioIdPaginated(
    portfolioIds: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto,
    calculationFrom: string
  ): Promise<PageDto<PopulatedPortfolioAsset>> {
    const { limit, skip } = pageOptionsDto;
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

    const results = await sql<{
      asset: string;
      amount: string;
      symbol: string;
      name: string;
      logo: string;
      price_per_unit: string;
      price_at_calculation: string;
      value: string;
      change: string;
      change_percentage: string | null;
      total_count: number;
    }>`
      WITH authorized_portfolios AS (
        -- Verify ownership of all portfolios
        SELECT id
        FROM portfolio
        WHERE id = ANY(${ids})
          AND user_id = ${userId}
      ),
      aggregated_assets AS (
        -- Aggregate current holdings across portfolios
        SELECT 
          pa.asset,
          SUM(pa.amount) AS amount
        FROM portfolio_assets pa
        INNER JOIN authorized_portfolios ap 
          ON pa.portfolio_id = ap.id
        GROUP BY pa.asset
      ),
      asset_details AS (
        -- For each asset, retrieve the current price and the price at the given calculation time
        SELECT 
          aa.asset,
          aa.amount,
          a.symbol,
          a.name,
          a.logo,
          COALESCE(
            (
              SELECT price
              FROM price
              WHERE asset = aa.asset
              ORDER BY time DESC
              LIMIT 1
            ), 0
          ) AS price_per_unit,
          COALESCE(
            (
              SELECT price
              FROM price
              WHERE asset = aa.asset
                AND time <= ${calculationFrom}::timestamptz
              ORDER BY time DESC
              LIMIT 1
            ), 0
          ) AS price_at_calculation
        FROM aggregated_assets aa
        INNER JOIN asset a 
          ON a.symbol = aa.asset
      )
      SELECT 
        ad.asset,
        ad.amount::text,
        ad.symbol,
        ad.name,
        ad.logo,
        ad.price_per_unit::text,
        ad.price_at_calculation::text as price_at_calculation,
        (ad.amount * ad.price_per_unit)::text AS value,
        -- Price change: current price - price at the calculation time
        CASE 
          WHEN ad.price_per_unit > 0 OR ad.price_at_calculation > 0
          THEN (ad.price_per_unit - ad.price_at_calculation)::text
          ELSE '0'
        END AS change,
        -- Price change percentage: (current price - price at calculation) / price at calculation * 100
        CASE 
          WHEN ad.price_at_calculation > 0 
          THEN (((ad.price_per_unit - ad.price_at_calculation) / ad.price_at_calculation) * 100)::text
          ELSE '0'
        END AS change_percentage,
        COUNT(*) OVER() AS total_count
      FROM asset_details ad
      ORDER BY (ad.amount * ad.price_per_unit) DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `.execute(this.db.query);

    const totalCount =
      results.rows.length > 0 ? Number(results.rows[0].total_count) : 0;
    const pageMetaDto = new PageMetaDto({
      itemCount: totalCount,
      pageOptionsDto,
    });

    return new PageDto<PopulatedPortfolioAsset>(
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
          price_at_calculation: Number(v.price_at_calculation),
          change: Number(v.change),
          change_percentage: +v.change_percentage,
        })
      ),
      pageMetaDto
    );
  }

  async findAssetAllocation(portfolioIds: string | string[], userId: string) {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

    const records = await sql<{
      symbol: string;
      name: string;
      logo: string;
      amount: number;
      value: number;
      allocation_percentage: number;
    }>`
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

    const assets = records.rows.map((row) => ({
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
