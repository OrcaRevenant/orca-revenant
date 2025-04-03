import { Inject, Injectable } from "@nestjs/common";
import { Price } from "./price.types";
import { DatabaseService } from "@/database/database.service";
import { Readable } from "stream";
import { from as copyFrom } from "pg-copy-streams";
import { PoolClient } from "pg";
import { ConfigType } from "@nestjs/config";
import priceConfig from "./price.config";
import { sql } from "kysely";

@Injectable()
export class PriceRepository {
  constructor(
    private readonly db: DatabaseService,
    @Inject(priceConfig.KEY)
    private readonly config: ConfigType<typeof priceConfig>
  ) {}

  async clean(): Promise<boolean> {
    const result = await this.db.query
      .deleteFrom("price")
      .where("price", "!=", "-1")
      .executeTakeFirst();

    return result?.numDeletedRows > 0;
  }

  async findLatestTimestamp(asset: string): Promise<Date | null> {
    const result = await this.db.query
      .selectFrom("price")
      .select("time")
      .where("asset", "=", asset)
      .orderBy("time", "desc")
      .limit(1)
      .executeTakeFirst();

    return result ? new Date(result.time) : null;
  }

  async insertInChunks(prices: Price[]): Promise<void> {
    const chunkSize = 1000;
    for (let i = 0; i < prices.length; i += chunkSize) {
      const chunk = prices.slice(i, i + chunkSize);
      await this.db.query.insertInto("price").values(chunk).execute();
    }
  }

  async bulkInsertUsingCopy(prices: Price[]): Promise<void> {
    const BATCH_SIZE = 10_000;

    let client: PoolClient;
    try {
      client = await this.db.pool.connect();

      for (let i = 0; i < prices.length; i += BATCH_SIZE) {
        const batch = prices.slice(i, i + BATCH_SIZE);

        const stream = Readable.from(
          batch
            .map((price) => `${price.asset},${price.price},${price.time}`)
            .join("\n")
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
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async insert(price: Partial<Price>): Promise<void> {
    const result = await this.db.query
      .insertInto("price")
      .values(price)
      .execute();
    if (!result) {
      throw new Error("Failed to insert price");
    }
  }

  /**
   * Gets the conversion rate from the default quote (USDT) to the target quote at a specific timestamp
   * @param targetQuote - The target quote asset
   * @param timestamp - The timestamp to get the rate for
   * @returns The conversion rate
   */
  async getConversionRate(
    targetQuote: string,
    timestamp?: Date
  ): Promise<number> {
    const standardizedTargetQuote = targetQuote.toLowerCase();

    if (standardizedTargetQuote === this.config.defaultQuote.toLowerCase()) {
      return 1;
    }

    const effectiveTimestamp = timestamp || new Date();

    const result = await this.db.query
      .selectFrom("price")
      .where("asset", "=", standardizedTargetQuote)
      .where("time", "<=", effectiveTimestamp)
      .orderBy("time", "desc")
      .limit(1)
      .select("price")
      .executeTakeFirst();

    return Number(result.price);
  }

  /**
   * Gets conversion rates for multiple timestamps
   * @param targetQuote - The target quote asset
   * @param timestamps - Array of timestamps to get rates for
   * @returns Map of timestamp to conversion rate
   */
  async getConversionRates(
    targetQuote: string,
    timestamps: Date[]
  ): Promise<Map<string, number>> {
    const standardizedTargetQuote = targetQuote.toLowerCase();

    if (standardizedTargetQuote === this.config.defaultQuote.toLowerCase()) {
      return new Map(timestamps.map((t) => [t.toISOString(), 1]));
    }

    const result = await sql`
      WITH time_series AS (
        SELECT unnest(ARRAY[${sql.join(timestamps.map((t) => sql`${t}`))}]::timestamptz[]) as time
      )
      SELECT 
        ts.time as requested_time,
        COALESCE(p.price, 1) as price
      FROM time_series ts
      LEFT JOIN LATERAL (
        SELECT price
        FROM price
        WHERE asset = ${standardizedTargetQuote}
        AND time <= ts.time
        ORDER BY time DESC
        LIMIT 1
      ) p ON true
      ORDER BY ts.time;
    `.execute(this.db.query);

    return new Map(
      result.rows.map((r: any) => [
        new Date(r.requested_time).toISOString(),
        Number(r.price),
      ])
    );
  }
}
