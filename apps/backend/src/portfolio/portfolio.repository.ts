import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UniqueIdentifier } from "@/connection/connection.abstract";
import { Portfolio } from "./portfolio.types";
import { DatabaseService } from "@/database/database.service";
import { sql } from "kysely";

@Injectable()
export class PortfolioRepository {
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

  async insert(payload: Partial<Portfolio>): Promise<Portfolio> {
    const result = await this.db.query
      .insertInto("portfolio")
      .values(payload)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Error creating portfolio");
    }
    return this.serialize(result);
  }

  async updateById(
    id: UniqueIdentifier,
    payload: Partial<Portfolio>,
  ): Promise<Portfolio> {
    const result = await this.db.query
      .updateTable("portfolio")
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

  async deleteById(
    id: UniqueIdentifier,
    userId: UniqueIdentifier,
  ): Promise<boolean> {
    const result = await this.db.query
      .deleteFrom("portfolio")
      .where("id", "=", `${id}`)
      .where("user_id", "=", `${userId}`)
      .returning("id")
      .executeTakeFirst();

    if (!result) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    return true;
  }

  async findByUser(userId: UniqueIdentifier): Promise<Portfolio[]> {
    const results = await this.db.query
      .selectFrom("portfolio")
      .selectAll()
      .where("user_id", "=", `${userId}`)
      .execute();

    return results.map(this.serialize);
  }

  async findAll(): Promise<Portfolio[]> {
    const results = await this.db.query
      .selectFrom("portfolio")
      .selectAll()
      .execute();

    return results.map(this.serialize);
  }

  async findByIdAndUser(
    id: UniqueIdentifier,
    userId: UniqueIdentifier,
  ): Promise<Portfolio> {
    const result = await this.db.query
      .selectFrom("portfolio")
      .selectAll()
      .where("id", "=", `${id}`)
      .where("user_id", "=", `${userId}`)
      .executeTakeFirst();

    if (!result) {
      throw new Error("Portfolio not found");
    }
    return this.serialize(result);
  }

  async updateStatusById(
    portfolioId: string,
    userId: string,
    status: Portfolio["status"],
  ): Promise<Portfolio> {
    const result = await this.db.query
      .updateTable("portfolio")
      .set({
        status,
        last_sync_at: new Date().toISOString(),
      })
      .where("id", "=", portfolioId)
      .where("user_id", "=", userId)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Error updating portfolio status");
    }

    return this.serialize(result);
  }

  async findUnsynced(minutes: number): Promise<Portfolio[]> {
    const thresholdTime = new Date(Date.now() - minutes * 60 * 1000)
      .toISOString();

    const results = await this.db.query
      .selectFrom("portfolio")
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

  async findAllocation(
    portfolioIds: string[],
    userId: string,
  ) {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

    // Verify ownership of all portfolios
    await this.isOwner(ids, userId);

    const result = await sql<
      { id: string; title: string; balance: number; percentage: number }
    >`
            WITH portfolio_balances AS (
                SELECT 
                    p.id,
                    p.title,
                    COALESCE(SUM(pa.amount * price.price), 0) as balance
                FROM portfolio p
                LEFT JOIN portfolio_assets pa ON pa.portfolio_id = p.id
                LEFT JOIN LATERAL (
                    SELECT price
                    FROM price
                    WHERE asset = pa.asset
                    ORDER BY time DESC
                    LIMIT 1
                ) price ON true
                WHERE p.id = ANY(${ids})
                GROUP BY p.id, p.title
            ),
            total_balance AS (
                SELECT SUM(balance) as total FROM portfolio_balances
            )
            SELECT 
                pb.id,
                pb.title,
                pb.balance::text,
                (pb.balance / NULLIF(tb.total, 0) * 100)::text as percentage
            FROM portfolio_balances pb
            CROSS JOIN total_balance tb
            ORDER BY pb.balance DESC;
        `.execute(this.db.query);

    return result.rows.map((row) => ({
      portfolio: {
        id: row.id,
        title: row.title,
      },
      balance: Number(row.balance),
      percentage: Number(row.percentage),
    }));
  }
  async findPortfolioAllocation(
    portfolioIds: string | string[],
    userId: string,
  ) {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

    await this.isOwner(ids, userId);

    const result = await sql<{
      id: string;
      title: string;
      balance: string;
      percentage: string;
    }>`
        WITH portfolio_balances AS (
            SELECT 
                p.id,
                p.title,
                COALESCE(SUM(pa.amount * price.price), 0) as balance
            FROM portfolio p
            LEFT JOIN portfolio_assets pa ON pa.portfolio_id = p.id
            LEFT JOIN LATERAL (
                SELECT price
                FROM price
                WHERE asset = pa.asset
                ORDER BY time DESC
                LIMIT 1
            ) price ON true
            WHERE p.id = ANY(${ids})
            GROUP BY p.id, p.title
        ),
        total_balance AS (
            SELECT SUM(balance) as total FROM portfolio_balances
        )
        SELECT 
            pb.id,
            pb.title,
            pb.balance::text,
            (pb.balance / NULLIF(tb.total, 0) * 100)::text as percentage
        FROM portfolio_balances pb
        CROSS JOIN total_balance tb
        ORDER BY pb.balance DESC;
    `.execute(this.db.query);

    return result.rows.map((row) => ({
      portfolio: {
        id: row.id,
        title: row.title,
      },
      balance: Number(row.balance),
      percentage: Number(row.percentage),
    }));
  }
  async findBalance(
    portfolioIds: UniqueIdentifier | UniqueIdentifier[],
    userId: UniqueIdentifier,
  ): Promise<number> {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

    const result = await sql`
            WITH authorized_portfolios AS (
                -- First verify ownership of all portfolios
                SELECT id
                FROM portfolio
                WHERE id = ANY(${ids})
                AND user_id = ${userId}
            ),
            portfolio_balances AS (
                SELECT 
                    pa.portfolio_id,
                    pa.asset,
                    pa.amount,
                    p.price
                FROM portfolio_assets pa
                INNER JOIN authorized_portfolios ap ON pa.portfolio_id = ap.id
                LEFT JOIN LATERAL (
                    SELECT price
                    FROM price
                    WHERE asset = pa.asset
                    ORDER BY time DESC
                    LIMIT 1
                ) p ON true
            )
            SELECT 
                COALESCE(SUM(amount * price), 0)::text as total_value,
                COUNT(DISTINCT portfolio_id) as found_portfolios
            FROM portfolio_balances;
        `.execute(this.db.query);

    return Number((result.rows[0] as any)?.total_value || 0);
  }

  async findBalanceHistory(
    portfolioIds: string | string[],
    userId: string,
    startDate: Date,
    endDate: Date,
    resolution: "hourly" | "daily" | "weekly" | "monthly",
  ) {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];
    const interval = this.getResolutionInterval(resolution);

    const records = await sql`
          WITH authorized_portfolios AS (
              -- Verify ownership of all portfolios
              SELECT id
              FROM portfolio
              WHERE id = ANY(${ids})
              AND user_id = ${userId}
          ),
          time_buckets AS (
              SELECT time_bucket(${interval}::interval, generate_series(
                  ${startDate}::timestamptz,
                  ${endDate}::timestamptz,
                  ${interval}::interval
              )) AS bucket_time
          ),
          asset_balances AS (
              SELECT 
                  time_bucket(${interval}::interval, t.time) as bucket_time,
                  t.asset,
                  t.portfolio_id,
                  SUM(CASE 
                      WHEN t.type IN ('buy', 'deposit') THEN t.amount::numeric
                      WHEN t.type IN ('sell', 'withdrawal') THEN -t.amount::numeric
                      ELSE 0
                  END) OVER (
                      PARTITION BY t.portfolio_id, t.asset 
                      ORDER BY time_bucket(${interval}::interval, t.time)
                  ) as running_balance
              FROM public.transaction t
              INNER JOIN authorized_portfolios ap ON t.portfolio_id = ap.id
              WHERE t.time <= ${endDate}::timestamptz
          ),
          
          latest_balances AS (
              SELECT DISTINCT ON (b.portfolio_id, b.asset, tb.bucket_time)
                  tb.bucket_time,
                  b.portfolio_id,
                  b.asset,
                  LAST_VALUE(b.running_balance) OVER (
                      PARTITION BY b.portfolio_id, b.asset, tb.bucket_time
                      ORDER BY b.bucket_time
                      RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                  ) as balance
              FROM time_buckets tb
              LEFT JOIN asset_balances b 
                  ON b.bucket_time <= tb.bucket_time
              WHERE b.running_balance IS NOT NULL
          ),
          
          aggregated_balances AS (
              SELECT
                  bucket_time,
                  asset,
                  SUM(balance) as total_balance
              FROM latest_balances
              GROUP BY bucket_time, asset
          ),
          
          valuations AS (
              SELECT 
                  ab.bucket_time,
                  ab.asset,
                  ab.total_balance as amount,
                  p.price as price_per_unit,
                  (ab.total_balance * p.price) as value
              FROM aggregated_balances ab
              LEFT JOIN LATERAL (
                  SELECT price
                  FROM public.price
                  WHERE asset = ab.asset
                  AND time <= ab.bucket_time
                  ORDER BY time DESC
                  LIMIT 1
              ) p ON true
              WHERE ab.total_balance != 0
          )
          
          SELECT 
              v.bucket_time as time,
              jsonb_agg(
                  jsonb_build_object(
                      'asset', v.asset,
                      'amount', v.amount::text,
                      'price_per_unit', v.price_per_unit::text,
                      'value', v.value::text
                  )
              ) as balances,
              SUM(v.value)::text as total_value
          FROM valuations v
          GROUP BY v.bucket_time
          ORDER BY v.bucket_time;
      `.execute(this.db.query);

    return records.rows;
  }

  async findBestPerformingAsset(
    portfolioId: string | string[],
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    asset: {
      symbol: string;
      name: string;
      logo: string;
    };
    start_price: number;
    current_price: number;
    price_change: number;
    percentage_change: number;
    total_value: number;
    pnl: number;
    amount: number;
  }> {
    const ids = Array.isArray(portfolioId) ? portfolioId : [portfolioId];

    // Verify ownership of all portfolios
    await this.isOwner(ids, userId);

    const result = await sql<{
      asset: string;
      name: string;
      logo: string;
      amount: string;
      start_price: string;
      current_price: string;
      price_change: string;
      percentage_change: string;
      total_value: string;
      pnl: string;
    }>`
        WITH portfolio_assets_aggregated AS (
            SELECT 
                pa.asset,
                SUM(pa.amount) as amount
            FROM portfolio_assets pa
            WHERE pa.portfolio_id = ANY(${ids})
            GROUP BY pa.asset
        ),
        asset_prices AS (
            SELECT 
                paa.asset,
                paa.amount,
                a.name,
                a.logo,
                a.alt_names,
                first_price.price as start_price,
                last_price.price as current_price,
                (last_price.price - first_price.price) as price_change,
                ((last_price.price - first_price.price) / NULLIF(first_price.price, 0) * 100) as percentage_change,
                (paa.amount * last_price.price) as total_value,
                (paa.amount * (last_price.price - first_price.price)) as pnl
            FROM portfolio_assets_aggregated paa
            INNER JOIN asset a ON a.symbol = paa.asset
            LEFT JOIN LATERAL (
                SELECT price
                FROM price p
                WHERE p.asset = paa.asset
                AND p.time >= ${startDate}
                ORDER BY p.time ASC
                LIMIT 1
            ) first_price ON true
            LEFT JOIN LATERAL (
                SELECT price
                FROM price p
                WHERE p.asset = paa.asset
                AND p.time <= ${endDate}
                ORDER BY p.time DESC
                LIMIT 1
            ) last_price ON true
            WHERE paa.amount > 0
        )
        SELECT *
        FROM asset_prices
        ORDER BY percentage_change DESC
        LIMIT 1;
    `.execute(this.db.query);

    if (result.rows.length === 0) {
      throw new NotFoundException(
        "No assets found for the specified portfolios",
      );
    }

    const asset = result.rows[0];
    return {
      asset: {
        symbol: asset.asset,
        name: asset.name,
        logo: asset.logo,
      },
      start_price: Number(asset.start_price),
      current_price: Number(asset.current_price),
      price_change: Number(asset.price_change),
      percentage_change: Number(asset.percentage_change),
      total_value: Number(asset.total_value),
      pnl: Number(asset.pnl),
      amount: Number(asset.amount),
    };
  }

  async findAssetPriceHistory(
    portfolioId: string,
    assetSymbol: string,
    startDate: Date,
    endDate: Date,
    resolution: "hourly" | "daily" | "weekly" | "monthly",
  ) {
    const interval = this.getResolutionInterval(resolution);

    const result = await sql`
          WITH time_buckets AS (
            SELECT time_bucket(${interval}::interval, generate_series(
              ${startDate}::timestamptz,
              ${endDate}::timestamptz,
              ${interval}::interval
            )) AS bucket_time
          ),
          
          asset_info AS (
            SELECT 
              a.*,
              pa.amount
            FROM asset a
            INNER JOIN portfolio_assets pa ON pa.asset = a.symbol
            WHERE pa.portfolio_id = ${portfolioId}
            AND a.symbol = ${assetSymbol}
          ),
    
          price_history AS (
            SELECT 
              tb.bucket_time as time,
              COALESCE(p.price, LAG(p.price) OVER (ORDER BY tb.bucket_time)) as price
            FROM time_buckets tb
            LEFT JOIN LATERAL (
              SELECT price
              FROM price
              WHERE asset = ${assetSymbol}
              AND time <= tb.bucket_time
              ORDER BY time DESC
              LIMIT 1
            ) p ON true
          ),
          
          performance_metrics AS (
            SELECT 
              MIN(price) as low_price,
              MAX(price) as high_price,
              FIRST_VALUE(price) OVER (ORDER BY time) as start_price,
              LAST_VALUE(price) OVER (ORDER BY time RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as end_price
            FROM price_history
            WHERE price IS NOT NULL
          )
    
          SELECT 
            ai.symbol,
            ai.name,
            ai.logo,
            ai.alt_names,
            ai.amount,
            ph.time,
            ph.price,
            (ph.price * ai.amount) as value,
            pm.low_price,
            pm.high_price,
            pm.start_price,
            pm.end_price,
            (pm.end_price - pm.start_price) as price_change,
            ((pm.end_price - pm.start_price) / NULLIF(pm.start_price, 0) * 100) as percentage_change,
            (ai.amount * (pm.end_price - pm.start_price)) as pnl
          FROM price_history ph
          CROSS JOIN asset_info ai
          CROSS JOIN performance_metrics pm
          ORDER BY ph.time;
        `.execute(this.db.query);

    if (result.rows.length === 0) {
      throw new NotFoundException("Asset not found in portfolio");
    }

    const firstRow = result.rows[0] as any;
    const priceHistory = result.rows.map((row: any) => ({
      time: row.time,
      price: Number(row.price),
      value: Number(row.value),
    }));

    return {
      asset: {
        symbol: firstRow.symbol,
        name: firstRow.name,
        logo: firstRow.logo,
      },
      priceHistory,
      performanceMetrics: {
        startPrice: Number(firstRow.start_price),
        endPrice: Number(firstRow.end_price),
        highPrice: Number(firstRow.high_price),
        lowPrice: Number(firstRow.low_price),
        priceChange: Number(firstRow.price_change),
        percentageChange: Number(firstRow.percentage_change),
        pnl: Number(firstRow.pnl),
      },
    };
  }

  private getResolutionInterval(resolution: string): string {
    const intervals = {
      hourly: "1 hour",
      daily: "1 day",
      weekly: "1 week",
      monthly: "1 month",
    };
    return intervals[resolution] || "1 day";
  }

  async isOwner(
    portfolioId: UniqueIdentifier | UniqueIdentifier[],
    userId: UniqueIdentifier,
  ): Promise<boolean> {
    const ids = Array.isArray(portfolioId) ? portfolioId : [portfolioId];

    const portfolios = await this.db.query
      .selectFrom("portfolio")
      .select(["id", "user_id"])
      .where("id", "in", ids.map((id) => `${id}`))
      .execute();

    if (portfolios.length !== ids.length) {
      throw new NotFoundException("Portfolio not found");
    }

    const hasUnauthorizedAccess = portfolios.some(
      (portfolio) => portfolio.user_id !== `${userId}`,
    );

    if (hasUnauthorizedAccess) {
      throw new ForbiddenException(
        "Not authorized to access this portfolio",
      );
    }

    return true;
  }
}
