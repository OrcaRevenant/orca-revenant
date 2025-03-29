import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UniqueIdentifier } from "@/connection/connection.abstract";
import { PopulatedPortfolio, Portfolio } from "./portfolio.types";
import { DatabaseService } from "@/database/database.service";
import { sql } from "kysely";
import { Connection } from "@/connection/connection.types";

@Injectable()
export class PortfolioRepository {
  constructor(private readonly db: DatabaseService) {}

  private serialize(portfolio: any): Portfolio {
    return {
      meta: portfolio.meta,
      connection_name: portfolio.connection_name,
      created_at: portfolio.created_at,
      disabled: !!portfolio.disabled,
      id: `${portfolio.id}`,
      last_sync_at: portfolio.last_sync_at,
      title: portfolio.title,
      user_id: `${portfolio.user_id}`,
      color: `${portfolio.color}`,
      status: portfolio.status,
      group_id: portfolio.group_id,
    };
  }

  private serializePopulated(portfolio: any): PopulatedPortfolio {
    return {
      created_at: portfolio.created_at,
      disabled: !!portfolio.disabled,
      id: `${portfolio.id}`,
      last_sync_at: portfolio.last_sync_at,
      title: portfolio.title,
      user_id: `${portfolio.user_id}`,
      color: `${portfolio.color}`,
      status: portfolio.status,
      group_id: portfolio.group_id,
      meta: portfolio.meta,
      connection: portfolio.connection,
      value: portfolio.value,
      asset_count: portfolio.asset_count,
      assets: portfolio.assets,
    };
  }

  private async executePortfolioOperation<T>(
    operation: (query: any) => Promise<any>,
    errorMessage: string
  ): Promise<T> {
    try {
      const result = await operation(this.db.query);
      if (!result) {
        throw new Error(errorMessage);
      }
      return result;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new Error(`${errorMessage}: ${(error as Error).message}`);
    }
  }

  async insert(payload: Partial<Portfolio>): Promise<Portfolio> {
    return this.executePortfolioOperation<Portfolio>(
      (query) =>
        query
          .insertInto("portfolio")
          .values(payload as any)
          .returningAll()
          .executeTakeFirst()
          .then((result) => this.serialize(result)),
      "Error creating portfolio"
    );
  }

  async updateById(
    id: UniqueIdentifier,
    payload: Partial<Portfolio>
  ): Promise<Portfolio> {
    return this.executePortfolioOperation<Portfolio>(
      (query) =>
        query
          .updateTable("portfolio")
          .set(payload as any)
          .where("id", "=", `${id}`)
          .where("user_id", "=", payload.user_id)
          .returningAll()
          .executeTakeFirst()
          .then((result) => this.serialize(result)),
      "Error updating portfolio"
    );
  }

  async deleteById(
    id: UniqueIdentifier,
    userId: UniqueIdentifier
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
    userId: UniqueIdentifier
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
    status: Portfolio["status"]
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
    const thresholdTime = new Date(
      Date.now() - minutes * 60 * 1000
    ).toISOString();

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

  private getPortfolioBalanceQuery(portfolioIds: string[]) {
    return sql<{
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
          WHERE p.id = ANY(${portfolioIds})
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
    `;
  }

  async findPortfolioAllocation(
    portfolioIds: string | string[],
    userId: string
  ): Promise<
    Array<{
      portfolio: {
        id: string;
        title: string;
      };
      balance: number;
      percentage: number;
    }>
  > {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];
    await this.isOwner(ids, userId);

    const query = this.getPortfolioBalanceQuery(ids);
    const result = await query.execute(this.db.query);

    return result.rows.map((row) => ({
      portfolio: {
        id: String(row.id),
        title: String(row.title || ""),
      },
      balance: Number(row.balance || 0),
      percentage: Number(row.percentage || 0),
    }));
  }

  async findAllocation(portfolioIds: string[], userId: string) {
    return this.findPortfolioAllocation(portfolioIds, userId);
  }

  async findBalance(
    portfolioIds: UniqueIdentifier | UniqueIdentifier[],
    userId: UniqueIdentifier
  ): Promise<number> {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

    await this.isOwner(ids, userId);

    const result = await sql`
        WITH portfolio_balances AS (
            SELECT 
                pa.portfolio_id,
                pa.asset,
                pa.amount,
                p.price
            FROM portfolio_assets pa
            CROSS JOIN LATERAL (
                SELECT price
                FROM price
                WHERE asset = pa.asset
                ORDER BY time DESC
                LIMIT 1
            ) p
            WHERE pa.portfolio_id = ANY(${ids})
        )
        SELECT 
            COALESCE(SUM(amount * price), 0)::text as total_value,
            COUNT(DISTINCT portfolio_id) as found_portfolios
        FROM portfolio_balances;
    `.execute(this.db.query);

    type BalanceResult = { total_value: string; found_portfolios: number };
    const firstRow = result.rows[0] as BalanceResult | undefined;
    return Number(firstRow?.total_value || 0);
  }

  async findBalanceHistory(
    portfolioIds: string | string[],
    userId: string,
    startDate: Date,
    endDate: Date,
    resolution: string
  ) {
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];
    const interval = resolution;

    await this.isOwner(ids, userId);

    const records = await sql`
      WITH time_buckets AS (
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
          WHERE t.portfolio_id = ANY(${ids})
          AND t.time <= ${endDate}::timestamptz
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
    endDate: Date
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
        "No assets found for the specified portfolios"
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
    resolution: "hourly" | "daily" | "weekly" | "monthly"
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

    // Define proper types for the result
    type AssetPriceRow = {
      symbol: string;
      name: string;
      logo: string;
      time: Date;
      price: string;
      value: string;
      start_price: string;
      end_price: string;
      high_price: string;
      low_price: string;
      price_change: string;
      percentage_change: string;
      pnl: string;
    };

    const firstRow = result.rows[0] as AssetPriceRow;
    const priceHistory = result.rows.map((row: AssetPriceRow) => ({
      time: row.time,
      price: Number(row.price || 0),
      value: Number(row.value || 0),
    }));

    return {
      asset: {
        symbol: firstRow.symbol,
        name: firstRow.name,
        logo: firstRow.logo,
      },
      priceHistory,
      performanceMetrics: {
        startPrice: Number(firstRow.start_price || 0),
        endPrice: Number(firstRow.end_price || 0),
        highPrice: Number(firstRow.high_price || 0),
        lowPrice: Number(firstRow.low_price || 0),
        priceChange: Number(firstRow.price_change || 0),
        percentageChange: Number(firstRow.percentage_change || 0),
        pnl: Number(firstRow.pnl || 0),
      },
    };
  }

  async populatePortfolio(
    portfolioInput: Portfolio[] | Portfolio
  ): Promise<PopulatedPortfolio[]> {
    const portfolios: Portfolio[] = Array.isArray(portfolioInput)
      ? portfolioInput
      : [portfolioInput];

    if (portfolios.length === 0) {
      return [];
    }

    const portfolioIds = portfolios.map((p) => p.id);

    const result: PopulatedPortfolio[] = portfolios.map((portfolio) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { connection_name, ...portfolioWithoutConnectionName } = portfolio;
      return {
        ...portfolioWithoutConnectionName,
        connection: null,
        value: 0,
        asset_count: 0,
        assets: [],
      };
    });

    const statsResult = await this.getPortfolioStats(portfolioIds);

    type PortfolioStats = {
      id: string;
      value: number;
      asset_count: number;
      assets: string[];
    };

    const statsByPortfolioId = statsResult.reduce(
      (acc, row) => {
        acc[row.id] = row;
        return acc;
      },
      {} as Record<string, PortfolioStats>
    );

    result.forEach((portfolio) => {
      const stats = statsByPortfolioId[portfolio.id];
      if (stats) {
        portfolio.value = stats.value;
        portfolio.asset_count = stats.asset_count;
        portfolio.assets = stats.assets;
      }
    });

    const connectionNames = portfolios
      .map((p) => p.connection_name)
      .filter(Boolean);
    if (connectionNames.length > 0) {
      const connections = await this.getConnectionsByNames(connectionNames);

      result.forEach((portfolio, index) => {
        const connectionName = portfolios[index].connection_name;
        if (connectionName) {
          portfolio.connection = connections[connectionName] || null;
        }
      });
    }

    return result.map(this.serializePopulated);
  }

  private async getPortfolioStats(portfolioIds: string[]): Promise<
    Array<{
      id: string;
      value: number;
      asset_count: number;
      assets: string[];
    }>
  > {
    // Add type parameter to sql template literal
    const statsResult = await sql<{
      id: string | number;
      value: string | number | null;
      asset_count: string | number | null;
      assets: string[] | null;
    }>`
      WITH portfolio_values AS (
        SELECT 
          pa.portfolio_id,
          pa.asset,
          SUM(pa.amount * p.price) as total_value
        FROM portfolio_assets pa
        LEFT JOIN LATERAL (
          SELECT price
          FROM price
          WHERE asset = pa.asset
          ORDER BY time DESC
          LIMIT 1
        ) p ON true
        WHERE pa.portfolio_id = ANY(${portfolioIds})
        GROUP BY pa.portfolio_id, pa.asset
      ),
      portfolio_stats AS (
        SELECT 
          p.id,
          COALESCE(SUM(pv.total_value), 0) as value,
          COUNT(DISTINCT pv.asset) as asset_count,
          array_agg(DISTINCT pv.asset) as assets
        FROM portfolio p
        LEFT JOIN portfolio_values pv ON p.id = pv.portfolio_id
        WHERE p.id = ANY(${portfolioIds})
        GROUP BY p.id
      )
      SELECT * FROM portfolio_stats
    `.execute(this.db.query);

    // Transform the raw SQL results to the expected type with proper null handling
    return statsResult.rows.map((row) => ({
      id: String(row.id),
      value: Number(row.value || 0),
      asset_count: Number(row.asset_count || 0),
      assets: Array.isArray(row.assets) ? row.assets : [],
    }));
  }

  private async getConnectionsByNames(
    connectionNames: string[]
  ): Promise<
    Record<string, Pick<Connection, "logo" | "name" | "title" | "type">>
  > {
    const connectionsResult = await this.db.query
      .selectFrom("connection")
      .select(["name", "logo", "title", "type"])
      .where("name", "in", connectionNames)
      .execute();

    return connectionsResult.reduce(
      (acc, conn) => {
        if (conn.name) {
          acc[conn.name] = {
            name: conn.name,
            logo: conn.logo || null,
            title: conn.title || null,
            type: conn.type || null,
          };
        }
        return acc;
      },
      {} as Record<string, Pick<Connection, "logo" | "name" | "title" | "type">>
    );
  }

  private getResolutionInterval(resolution: string): string {
    const intervals: Record<string, string> = {
      hourly: "1 hour",
      daily: "1 day",
      weekly: "1 week",
      monthly: "1 month",
    };
    return intervals[resolution] || "1 day";
  }

  async isOwner(
    portfolioId: UniqueIdentifier | UniqueIdentifier[],
    userId: UniqueIdentifier
  ): Promise<boolean> {
    const ids = Array.isArray(portfolioId) ? portfolioId : [portfolioId];

    const portfolios = await this.db.query
      .selectFrom("portfolio")
      .select(["id", "user_id"])
      .where(
        "id",
        "in",
        ids.map((id) => `${id}`)
      )
      .execute();

    if (portfolios.length !== ids.length) {
      throw new NotFoundException("Portfolio not found");
    }

    const hasUnauthorizedAccess = portfolios.some(
      (portfolio) => portfolio.user_id !== `${userId}`
    );

    if (hasUnauthorizedAccess) {
      throw new ForbiddenException("Not authorized to access this portfolio");
    }

    return true;
  }
}
