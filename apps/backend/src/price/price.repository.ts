import { Injectable } from "@nestjs/common";
import { sql } from "kysely";
import { Price } from "./price.types";
import dayjs from "dayjs";
import { DatabaseService } from "@/database/database.service";
import { Readable } from "stream";
import { from as copyFrom } from "pg-copy-streams";

@Injectable()
export class PriceRepository {
    private readonly table = "price";

    constructor(private readonly db: DatabaseService) {}

    async clean(): Promise<boolean> {
        const result = await this.db.query
            .deleteFrom(this.table)
            .where("price", "!=", "-1")
            .executeTakeFirst();

        return result?.numDeletedRows > 0;
    }

    async getLastPriceTime(asset: string): Promise<Date | null> {
        const result = await this.db.query
            .selectFrom(this.table)
            .select("time")
            .where("asset", "=", asset)
            .orderBy("time", "desc")
            .limit(1)
            .executeTakeFirst();

        return result ? new Date(result.time) : null;
    }

    async insertMany(
        prices: Price[],
    ): Promise<void> {
        const chunkSize = 1000;
        for (let i = 0; i < prices.length; i += chunkSize) {
            const chunk = prices.slice(i, i + chunkSize);
            await this.db.query
                .insertInto("price")
                .values(chunk)
                .execute();
        }
    }

    async copy(
        prices: Price[],
    ): Promise<void> {
        const BATCH_SIZE = 10_000;

        try {
            const client = await this.db.pool.connect();

            for (let i = 0; i < prices.length; i += BATCH_SIZE) {
                const batch = prices.slice(i, i + BATCH_SIZE);

                const stream = Readable.from(
                    batch
                        .map((price) =>
                            `${price.asset},${price.price},${price.time}`
                        )
                        .join("\n"),
                );

                const copyQuery = `
                    COPY price (asset, price, time)
                    FROM STDIN
                    WITH (FORMAT csv)
                `;

                const copyStream = client.query(copyFrom(copyQuery));

                stream.pipe(copyStream);

                await new Promise((resolve, reject) => {
                    copyStream.on("finish", resolve);
                    copyStream.on("error", reject);
                });
            }
        } catch (error) {
            console.error("Error during bulk insert:", error);
            throw error;
        }
    }

    async insert(price: Partial<Price>): Promise<void> {
        const result = await this.db.query.insertInto(this.table).values(price)
            .execute();
        if (!result) {
            throw new Error("Failed to insert price");
        }
    }

    async getNearestPrice(asset: string, time: string): Promise<number | null> {
        const timestamp = dayjs(time).toISOString();

        const result = await this.db.query
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
