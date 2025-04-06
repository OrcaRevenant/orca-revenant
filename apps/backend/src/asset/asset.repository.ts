import { Injectable } from "@nestjs/common";
import { Asset } from "./asset.types";
import { DatabaseService } from "@/database/database.service";
import { sql } from "kysely";

@Injectable()
export class AssetRepository {
  constructor(private readonly db: DatabaseService) {}

  private serialize(asset: any): Asset {
    return {
      alt_names: asset.alt_names,
      logo: asset.logo,
      name: asset.name,
      symbol: asset.symbol.toLowerCase(),
    };
  }

  async findAll(): Promise<Asset[]> {
    const assets = await this.db.query
      .selectFrom("asset")
      .selectAll()
      .execute();

    return assets.map(this.serialize);
  }

  async findAssetPriceHistory(
    assetSymbol: string,
    startDate: Date,
    endDate: Date,
    resolution: string
  ) {
    const interval = resolution;

    const result = await sql`
      WITH 
      -- Generate a series of timestamps
      time_series AS (
        SELECT generate_series(
          ${startDate}::timestamptz,
          ${endDate}::timestamptz,
          ${interval}::interval
        ) AS ts
      ),
      -- Bucket the times and remove duplicate bucket entries
      time_buckets AS (
        SELECT DISTINCT time_bucket(${interval}::interval, ts) AS bucket_time
        FROM time_series
      ),
      -- Build the price history by getting the last known price at or before each bucket time
      price_history AS (
        SELECT 
          tb.bucket_time AS time,
          COALESCE(
            p.price, 
            LAG(p.price) OVER (ORDER BY tb.bucket_time)
          ) AS price
        FROM time_buckets tb
        LEFT JOIN LATERAL (
          SELECT price
          FROM price
          WHERE asset = ${assetSymbol}
            AND time <= tb.bucket_time
          ORDER BY time DESC
          LIMIT 1
        ) p ON true
      )
      SELECT 
        time, 
        price
      FROM price_history
      ORDER BY time;
    `.execute(this.db.query);

    if (!result.rows.length) {
      throw new Error("No data found for the given asset and date range.");
    }

    // Map the rows to an array of objects containing only time and price.
    const priceHistory = result.rows.map((row: any) => ({
      time: row.time,
      price: Number(row.price),
    }));

    return priceHistory;
  }
}
