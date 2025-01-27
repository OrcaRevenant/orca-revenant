import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
        CREATE OR REPLACE FUNCTION insert_transactions_with_values(transaction_array JSONB)
    RETURNS VOID
    LANGUAGE plpgsql
    AS $$
    DECLARE
        transaction RECORD;
    BEGIN
        -- Step 1: Create a temporary table for the input transactions
        CREATE TEMP TABLE temp_transactions (
            hash TEXT,
            portfolio_id BIGINT,
            asset TEXT,
            amount NUMERIC,
            time TIMESTAMPTZ,
            type TEXT
        );

        -- Step 2: Insert the array of transactions into the temporary table
        INSERT INTO temp_transactions (hash, portfolio_id, asset, amount, time, type)
        SELECT
            t.hash,
            t.portfolio_id,
            LOWER(t.asset) AS asset, -- Ensure asset names are lowercase
            t.amount,
            t.time::timestamptz,
            t.type
        FROM jsonb_to_recordset(transaction_array) AS t(
            hash TEXT,
            portfolio_id BIGINT,
            asset TEXT,
            amount NUMERIC,
            time TEXT,
            type TEXT
        );

        -- Step 3: Fetch prices for all transactions in bulk
        CREATE TEMP TABLE temp_prices AS
        SELECT 
            t.asset,
            t.time AS transaction_time,
            p.price
        FROM 
            (SELECT DISTINCT asset, time FROM temp_transactions) t
        LEFT JOIN LATERAL (
            SELECT 
                price
            FROM 
                public.price p
            WHERE 
                p.asset = t.asset
                AND p.time <= t.time
            ORDER BY 
                p.time DESC
            LIMIT 1
        ) p ON true;

        -- Step 4: Insert transactions into the main table with calculated values
        INSERT INTO public.transaction (hash, portfolio_id, asset, amount, value, time, type)
        SELECT
            t.hash,
            t.portfolio_id,
            t.asset,
            t.amount,
            COALESCE(tp.price * t.amount, 0) AS value,
            t.time,
            t.type
        FROM 
            temp_transactions t
        LEFT JOIN 
            temp_prices tp
        ON 
            t.asset = tp.asset AND t.time = tp.transaction_time
        ON CONFLICT ON CONSTRAINT transaction_hash_time_unique 
        DO NOTHING;

        -- Cleanup: Drop temporary tables
        DROP TABLE temp_transactions;
        DROP TABLE temp_prices;
    END $$;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP FUNCTION IF EXISTS insert_transactions_with_values(jsonb);
  `.execute(db);
}