import {
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { UniqueIdentifier } from "@/connection/connection.abstract";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";
import {
    PopulatedPortfolioAsset,
    Portfolio,
    PortfolioAsset,
} from "./portfolio.types";
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

    private serializeAssets(result: any): PopulatedPortfolioAsset {
        return {
            amount: result.amount,
            asset: result.asset,
            portfolio_id: result.portfolio_id,
            value: result.value,
            price_per_unit: result.price_per_unit,
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
        portfolio: Portfolio,
        status: Portfolio["status"],
    ): Promise<Portfolio> {
        const result = await this.db.query
            .updateTable("portfolio")
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

    async insertAssets(
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

    async getTree(userId: string): Promise<any[]> {
        const result = await sql<any>`
        WITH items AS (
            -- Get all groups
            SELECT 
            id::text as id,
            title,
            color,
            parent_id::text as parent_id,
            'group'::text as type,
            NULL::text as connection_name,
            NULL::text as status,
            NULL::boolean as disabled
            FROM portfolio_group
            WHERE user_id = ${userId}
            
            UNION ALL
            
            -- Get all portfolios
            SELECT 
            id::text as id,
            title,
            color,
            group_id::text as parent_id,
            'portfolio'::text as type,
            connection_name,
            status,
            disabled
            FROM portfolio
            WHERE user_id = ${userId}
        )
        SELECT * FROM items
        ORDER BY type DESC, id
        `.execute(this.db.query);

        return this.buildTree(result.rows);
    }

    private buildTree(items: any[]): any[] {
        const tree = [];
        const childrenOf = {};

        // First create a map of all parent ids to empty arrays
        items.forEach((item) => {
            childrenOf[item.id] = [];
        });

        // Then populate the arrays with children
        items.forEach((item) => {
            const node: any = {
                id: item.id,
                title: item.title,
                color: item.color,
                type: item.type,
            };

            if (item.type === "portfolio") {
                node.connection_name = item.connection_name;
                node.status = item.status;
                node.disabled = item.disabled;
            }

            if (item.parent_id && childrenOf[item.parent_id]) {
                childrenOf[item.parent_id].push(node);
            } else {
                tree.push(node);
            }
        });

        // Finally, add children arrays to parent nodes
        items.forEach((item) => {
            if (childrenOf[item.id].length > 0) {
                const parent = tree.find((node) => node.id === item.id) ||
                    tree.flatMap((node) => childrenOf[node.id]).find((node) =>
                        node.id === item.id
                    );
                if (parent) {
                    parent.children = childrenOf[item.id];
                }
            }
        });

        return tree;
    }

    async findAssetsPaginated(
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
                this.serializeAssets({
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

    async findPortfolioAssets(
        portfolioId: string,
        userId: string,
    ) {
        await this.isOwner(portfolioId, userId);

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
          LEFT JOIN LATERAL (
            SELECT price
            FROM price
            WHERE asset = pa.asset
            ORDER BY time DESC
            LIMIT 1
          ) p ON true
          WHERE pa.portfolio_id = ${portfolioId}
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

    async findPortfolioAllocation(
        portfolioIds: string[],
        userId: string,
    ) {
        // Verify ownership of all portfolios
        await this.isOwner(portfolioIds, userId);

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

    async findPortfolioBalance(
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

    async findHistoricalBalance(
        portfolioId: string,
        userId: string,
        startDate: Date,
        endDate: Date,
        resolution: "hourly" | "daily" | "weekly" | "monthly",
    ) {
        await this.isOwner(portfolioId, userId);

        const interval = this.getResolutionInterval(resolution);

        // This query:
        // 1. Creates time buckets based on resolution
        // 2. Calculates running balance for each asset at each time point
        // 3. Joins with prices to get valuations
        // 4. Groups results by time bucket
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
              SUM(CASE 
                WHEN t.type IN ('buy', 'deposit') THEN t.amount::numeric
                WHEN t.type IN ('sell', 'withdrawal') THEN -t.amount::numeric
                ELSE 0
              END) OVER (
                PARTITION BY t.asset 
                ORDER BY time_bucket(${interval}::interval, t.time)
              ) as running_balance
            FROM public.transaction t
            WHERE t.portfolio_id = ${portfolioId}
            AND t.time <= ${endDate}::timestamptz
          ),
          
          latest_balances AS (
            SELECT DISTINCT ON (b.asset, tb.bucket_time)
              tb.bucket_time,
              b.asset,
              LAST_VALUE(b.running_balance) OVER (
                PARTITION BY b.asset, tb.bucket_time
                ORDER BY b.bucket_time
                RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
              ) as balance
            FROM time_buckets tb
            LEFT JOIN asset_balances b 
              ON b.bucket_time <= tb.bucket_time
            WHERE b.running_balance IS NOT NULL
          ),
          
          valuations AS (
            SELECT 
              lb.bucket_time,
              lb.asset,
              lb.balance as amount,
              p.price as price_per_unit,
              (lb.balance * p.price) as value
            FROM latest_balances lb
            LEFT JOIN LATERAL (
              SELECT price
              FROM public.price
              WHERE asset = lb.asset
              AND time <= lb.bucket_time
              ORDER BY time DESC
              LIMIT 1
            ) p ON true
            WHERE lb.balance != 0
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
        portfolioId: string,
        userId: string,
        startDate: Date,
        endDate: Date,
    ) {
        await this.isOwner(portfolioId, userId);

        const result = await sql`
          WITH asset_prices AS (
            SELECT 
              pa.asset,
              pa.amount,
              a.name,
              a.logo,
              a.alt_names,
              first_price.price as start_price,
              last_price.price as current_price,
              (last_price.price - first_price.price) as price_change,
              ((last_price.price - first_price.price) / NULLIF(first_price.price, 0) * 100) as percentage_change,
              (pa.amount * last_price.price) as total_value,
              (pa.amount * (last_price.price - first_price.price)) as pnl
            FROM portfolio_assets pa
            INNER JOIN asset a ON a.symbol = pa.asset
            LEFT JOIN LATERAL (
              SELECT price
              FROM price p
              WHERE p.asset = pa.asset
              AND p.time >= ${startDate}
              ORDER BY p.time ASC
              LIMIT 1
            ) first_price ON true
            LEFT JOIN LATERAL (
              SELECT price
              FROM price p
              WHERE p.asset = pa.asset
              AND p.time <= ${endDate}
              ORDER BY p.time DESC
              LIMIT 1
            ) last_price ON true
            WHERE pa.portfolio_id = ${portfolioId}
            AND pa.amount > 0
          )
          SELECT *
          FROM asset_prices
          ORDER BY percentage_change DESC
          LIMIT 1;
        `.execute(this.db.query);

        const asset = result.rows[0] as any;
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
        userId: string,
        assetSymbol: string,
        startDate: Date,
        endDate: Date,
        resolution: "hourly" | "daily" | "weekly" | "monthly",
    ) {
        await this.isOwner(portfolioId, userId);

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

    async findPortfoliosByGroupId(
        groupId: string | "root",
        userId: string,
    ): Promise<any[]> {
        if (groupId === "root") {
            const result = await sql`
                WITH RECURSIVE group_hierarchy AS (
                -- Get all groups
                SELECT id, parent_id
                FROM portfolio_group
                WHERE user_id = ${userId}
                )
                SELECT DISTINCT
                p.id,
                p.title,
                p.color,
                p.connection_name,
                p.status,
                p.disabled,
                p.group_id,
                'portfolio' as type
                FROM portfolio p
                WHERE p.user_id = ${userId}
                ORDER BY p.id;
            `.execute(this.db.query);

            return result.rows;
        } else {
            const groupExists = await sql<any>`
                SELECT EXISTS (
                SELECT 1 
                FROM portfolio_group 
                WHERE id = ${groupId}::bigint 
                AND user_id = ${userId}
                ) as exists
            `.execute(this.db.query);

            if (!groupExists.rows[0].exists) {
                throw new NotFoundException(
                    `Group with id ${groupId} not found`,
                );
            }

            const result = await sql`
                WITH RECURSIVE group_hierarchy AS (
                -- Base case: start with the specified group
                SELECT id, parent_id
                FROM portfolio_group
                WHERE id = ${groupId}::bigint AND user_id = ${userId}
        
                UNION ALL
        
                -- Recursive case: get all child groups
                SELECT pg.id, pg.parent_id
                FROM portfolio_group pg
                INNER JOIN group_hierarchy gh ON pg.parent_id = gh.id
                WHERE pg.user_id = ${userId}
                )
                SELECT DISTINCT
                p.id,
                p.title,
                p.color,
                p.connection_name,
                p.status,
                p.disabled,
                p.group_id,
                'portfolio' as type
                FROM portfolio p
                LEFT JOIN group_hierarchy gh ON p.group_id = gh.id
                WHERE (p.group_id = ${groupId}::bigint OR p.group_id IN (SELECT id FROM group_hierarchy))
                AND p.user_id = ${userId}
                ORDER BY p.id;
            `.execute(this.db.query);

            return result.rows;
        }
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
