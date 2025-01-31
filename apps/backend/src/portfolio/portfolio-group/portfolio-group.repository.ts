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

    async findAll(userId: string): Promise<any[]> {
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
}
