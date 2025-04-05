import { DatabaseService } from "@/database/database.service";
import { Injectable } from "@nestjs/common";
import { ItemType, OrderItemDto } from "./portfolio-items-reorder.dto";

@Injectable()
export class PortfolioItemsOrderRepository {
  constructor(private readonly db: DatabaseService) {}

  async updateOrder(userId: string, items: OrderItemDto[]): Promise<void> {
    await this.db.query.transaction().execute(async (trx) => {
      const itemIds = items.map((item) => item.id);
      await trx
        .deleteFrom("portfolio_items_order")
        .where("user_id", "=", userId)
        .where("item_id", "in", itemIds)
        .execute();

      if (items.length > 0) {
        await trx
          .insertInto("portfolio_items_order")
          .values(
            items.map((item) => ({
              user_id: userId,
              item_type: item.type,
              item_id: item.id,
              order: item.order,
            }))
          )
          .execute();
      }
    });
  }

  async getOrder(userId: string): Promise<OrderItemDto[]> {
    const results = await this.db.query
      .selectFrom("portfolio_items_order")
      .select(["item_id", "item_type", "order"])
      .where("user_id", "=", userId)
      .orderBy("order", "asc")
      .execute();

    return results.map((result) => ({
      id: result.item_id,
      type: result.item_type as ItemType,
      order: result.order,
    }));
  }
}
