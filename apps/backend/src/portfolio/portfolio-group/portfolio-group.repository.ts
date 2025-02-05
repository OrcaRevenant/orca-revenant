import { DatabaseService } from "@/database/database.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { sql } from "kysely";
import { GroupUniqueIdentifier } from "./portfolio-group.types";

@Injectable()
export class PortfolioGroupRepository {
    constructor(private readonly db: DatabaseService) {}

    async findById(
        groupId: GroupUniqueIdentifier,
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

    async findAll(userId: string) {
        // Get portfolio values and asset counts with overall totals
        const stats = await sql`
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
                GROUP BY pa.portfolio_id, pa.asset
            ),
            portfolio_stats AS (
                SELECT 
                    p.id,
                    p.title,
                    p.color,
                    p.connection_name,
                    p.status,
                    p.disabled,
                    p.group_id,
                    COALESCE(SUM(pv.total_value), 0) as value,
                    COUNT(DISTINCT pv.asset) as asset_count,
                    array_agg(DISTINCT pv.asset) as assets
                FROM portfolio p
                LEFT JOIN portfolio_values pv ON p.id = pv.portfolio_id
                WHERE p.user_id = ${userId}
                GROUP BY p.id, p.title, p.color, p.connection_name, p.status, p.disabled, p.group_id
            ),
            unique_assets AS (
                SELECT DISTINCT asset
                FROM portfolio_values pv
                INNER JOIN portfolio p ON p.id = pv.portfolio_id
                WHERE p.user_id = ${userId}
            ),
            global_stats AS (
                SELECT 
                    SUM(value) as total_value,
                    (SELECT COUNT(*) FROM unique_assets) as total_unique_assets,
                    COUNT(*) as total_portfolios
                FROM portfolio_stats
            )
            SELECT 
                jsonb_build_object(
                    'portfolios', (SELECT jsonb_agg(ps.*) FROM portfolio_stats ps),
                    'global_stats', (SELECT row_to_json(gs.*) FROM global_stats gs)
                ) as result
        `.execute(this.db.query);

        // Get all groups
        const groups = await this.db.query
            .selectFrom("portfolio_group")
            .selectAll()
            .where("user_id", "=", userId)
            .execute();

        const { portfolios, global_stats } = (stats.rows[0] as any).result;

        return {
            groups,
            portfolios,
            global_stats,
        };
    }
}
