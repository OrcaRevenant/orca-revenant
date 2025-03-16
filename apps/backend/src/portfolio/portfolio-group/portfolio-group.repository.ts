import { DatabaseService } from "@/database/database.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { sql } from "kysely";
import {
  PortfolioGroup,
  PortfolioGroupUniqueIdentifier,
} from "./portfolio-group.types";

@Injectable()
export class PortfolioGroupRepository {
  constructor(private readonly db: DatabaseService) {}

  private serialize(group: any): PortfolioGroup {
    return {
      id: group.id,
      title: group.title,
      color: group.color,
      user_id: group.user_id,
      parent_id: group.parent_id,
      created_at: group.created_at,
    };
  }

  async findByIdAndUser(
    groupId: PortfolioGroupUniqueIdentifier,
    userId: string
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
        throw new NotFoundException(`Group with id ${groupId} not found`);
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

  async findByUser(userId: string): Promise<PortfolioGroup[]> {
    const groups = await this.db.query
      .selectFrom("portfolio_group")
      .selectAll()
      .where("user_id", "=", userId)
      .execute();

    return groups.map(this.serialize);
  }
}
