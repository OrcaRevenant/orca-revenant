import { Injectable } from "@nestjs/common";
import { PopulatedTransaction, Transaction } from "./transaction.types";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";
import { DatabaseService } from "@/database/database.service";
import { sql } from "kysely";

@Injectable()
export class TransactionRepository {
  constructor(private readonly db: DatabaseService) {}

  private serialize(result: any): PopulatedTransaction {
    return {
      id: result.id,
      hash: result.hash,
      portfolio: {
        id: result.portfolio_id,
        title: result.portfolio_title,
        connection: {
          logo: result.connection_logo,
          name: result.portfolio_connection_name,
          title: result.connection_title,
          type: result.connection_type,
        },
      },
      asset: {
        logo: result.logo,
        name: result.name,
        symbol: result.symbol,
      },
      amount: +result.amount,
      time: result.time,
      type: result.type,
      value: +result.value,
      portfolio_total_value: +result.portfolio_total_value || 0,
      pnl: +result.pnl || 0,
      pnl_percentage: +result.pnl_percentage || 0,
      balances: result.balances,
    } as any;
  }

  async insert(transactions: Partial<Transaction>[]): Promise<boolean> {
    const transactionsJsonb = JSON.stringify(transactions);
    const records =
      await sql`SELECT insert_transactions_with_values(${transactionsJsonb}::jsonb)`
        .execute(this.db.query);
    return records.rows.length > 0;
  }

  async findByPortfoliosIdPaginated(
    portfolioIds: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PopulatedTransaction>> {
    const { limit, skip } = pageOptionsDto;
    const ids = Array.isArray(portfolioIds) ? portfolioIds : [portfolioIds];

    const results = await sql<{
      id: string;
      time: string;
      asset: string;
      type: string;
      amount: string;
      portfolio_id: string;
      portfolio_user_id: string;
      portfolio_title: string;
      portfolio_connection_name: string;
      symbol: string;
      name: string;
      logo: string;
      connection_type: string;
      connection_logo: string;
      connection_title: string;
      transaction_price: string;
      total_count: number;
      balances: Record<string, unknown>;
      portfolio_total_value: string;
    }>`
      WITH tx AS (
        SELECT
          t.*,
          portfolio.user_id AS portfolio_user_id,
          portfolio.title AS portfolio_title,
          portfolio.connection_name AS portfolio_connection_name,
          asset.symbol AS symbol,
          asset.name AS name,
          asset.logo AS logo,
          connection.type AS connection_type,
          connection.logo AS connection_logo,
          connection.title AS connection_title,
          (
            SELECT price 
            FROM price 
            WHERE price.asset = t.asset 
              AND price.time <= t.time 
            ORDER BY price.time DESC 
            LIMIT 1
          ) AS transaction_price,
          (
            WITH asset_balances AS (
              SELECT 
                asset,
                SUM(CASE 
                  WHEN type IN ('buy', 'deposit') THEN amount::numeric
                  WHEN type IN ('sell', 'withdrawal') THEN -amount::numeric
                  ELSE 0
                END) as amount
              FROM transaction
              WHERE portfolio_id = t.portfolio_id
                AND time <= t.time
              GROUP BY asset
              HAVING SUM(CASE 
                WHEN type IN ('buy', 'deposit') THEN amount::numeric
                WHEN type IN ('sell', 'withdrawal') THEN -amount::numeric
                ELSE 0
              END) > 0
            )
            SELECT jsonb_agg(
              jsonb_build_object(
                'asset', ab.asset,
                'amount', ab.amount::text,
                'price_per_unit', COALESCE(p.price::text, '0'),
                'value', COALESCE((ab.amount * p.price)::text, '0')
              )
            )
            FROM asset_balances ab
            LEFT JOIN LATERAL (
              SELECT price
              FROM price
              WHERE price.asset = ab.asset
                AND price.time <= t.time
              ORDER BY price.time DESC
              LIMIT 1
            ) p ON true
          ) AS balances,
          (
            SELECT COALESCE(SUM((value_data->>'value')::numeric), 0)::text
            FROM jsonb_array_elements(
              (
                WITH asset_balances AS (
                  SELECT 
                    asset,
                    SUM(CASE 
                      WHEN type IN ('buy', 'deposit') THEN amount::numeric
                      WHEN type IN ('sell', 'withdrawal') THEN -amount::numeric
                      ELSE 0
                    END) as amount
                  FROM transaction
                  WHERE portfolio_id = t.portfolio_id
                    AND time <= t.time
                  GROUP BY asset
                  HAVING SUM(CASE 
                    WHEN type IN ('buy', 'deposit') THEN amount::numeric
                    WHEN type IN ('sell', 'withdrawal') THEN -amount::numeric
                    ELSE 0
                  END) > 0
                )
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'asset', ab.asset,
                    'amount', ab.amount::text,
                    'price_per_unit', COALESCE(p.price::text, '0'),
                    'value', COALESCE((ab.amount * p.price)::text, '0')
                  )
                )
                FROM asset_balances ab
                LEFT JOIN LATERAL (
                  SELECT price
                  FROM price
                  WHERE price.asset = ab.asset
                    AND price.time <= t.time
                  ORDER BY price.time DESC
                  LIMIT 1
                ) p ON true
              )
            ) as value_data
          ) AS portfolio_total_value
        FROM transaction t
        INNER JOIN portfolio ON portfolio.id = t.portfolio_id
        INNER JOIN asset ON asset.symbol = t.asset
        LEFT JOIN connection ON connection.name = portfolio.connection_name
        WHERE t.portfolio_id = ANY(${ids})
          AND portfolio.user_id = ${userId}
      )
      SELECT
        tx.*,
        COUNT(*) OVER() AS total_count
      FROM tx
      ORDER BY time DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `.execute(this.db.query);

    if (results.rows.length === 0) {
      return new PageDto<PopulatedTransaction>(
        [],
        new PageMetaDto({ itemCount: 0, pageOptionsDto }),
      );
    }

    const totalCount = Number(results.rows[0].total_count);
    const pageMetaDto = new PageMetaDto({
      itemCount: totalCount,
      pageOptionsDto,
    });

    return new PageDto<PopulatedTransaction>(
      results.rows.map((row) =>
        this.serialize({
          ...row,
          amount: Number(row.amount),
          portfolio_total_value: row.portfolio_total_value,
        })
      ),
      pageMetaDto,
    );
  }
}
