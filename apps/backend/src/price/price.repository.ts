import { Injectable } from "@nestjs/common";
import { Kysely, sql } from "kysely";
import { Price } from "./price.types";
import dayjs from "dayjs";
import { DB } from "@orca/types";

@Injectable()
export class PriceRepository {
    private readonly table = "price";

    constructor(private readonly db: Kysely<DB>) {}

    private serialize(price: any): Price {
        return {
            ...price,
        };
    }

    async clean(): Promise<boolean> {
        const result = await this.db
            .deleteFrom(this.table)
            .where("price", "!=", "-1")
            .executeTakeFirst();

        return result?.numDeletedRows > 0;
    }

    async getLastPriceTime(asset: string): Promise<Date | null> {
        const result = await this.db
            .selectFrom(this.table)
            .select("time")
            .where("asset", "=", asset)
            .orderBy("time", "desc")
            .limit(1)
            .executeTakeFirst();

        return result ? new Date(result.time) : null;
    }

    async insertMany(prices: Partial<Price>[]): Promise<void> {
        const result = await this.db.insertInto(this.table).values(prices)
            .execute();
        if (!result) {
            throw new Error("Failed to insert prices");
        }
    }

    async insert(price: Partial<Price>): Promise<void> {
        const result = await this.db.insertInto(this.table).values(price)
            .execute();
        if (!result) {
            throw new Error("Failed to insert price");
        }
    }

    async getNearestPrice(asset: string, time: string): Promise<number | null> {
        const timestamp = dayjs(time).toISOString();

        const result = await this.db
            .selectFrom(this.table)
            .select(["price", "time"])
            .where("asset", "=", asset)
            .orderBy(
                sql`ABS(EXTRACT(EPOCH FROM time - TIMESTAMP ${
                    sql.lit(timestamp)
                }))`,
                "asc",
            )
            .limit(1)
            .executeTakeFirst();

        if (!result) return null;

        const timeDiffInSeconds = Math.abs(
            dayjs(timestamp).diff(dayjs(result.time), "seconds"),
        );

        return timeDiffInSeconds <= 120 ? +result.price : null;
    }
}
