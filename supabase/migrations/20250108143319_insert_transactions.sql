CREATE OR REPLACE FUNCTION insert_transactions_with_values(transactions jsonb) RETURNS void AS $$
DECLARE transaction_record RECORD;
BEGIN -- Validate input is a JSONB array
IF jsonb_typeof(transactions) != 'array' THEN RAISE EXCEPTION 'Input must be a JSONB array';
END IF;
-- Parse JSONB array into individual records
FOR transaction_record IN
SELECT *
FROM jsonb_populate_recordset(NULL::transaction, transactions) LOOP -- Perform an upsert operation
INSERT INTO transaction (
        hash,
        portfolio_id,
        asset,
        amount,
        fee,
        time,
        type
    )
VALUES (
        transaction_record.hash,
        transaction_record.portfolio_id,
        transaction_record.asset,
        transaction_record.amount,
        transaction_record.fee,
        transaction_record.time,
        transaction_record.type
    ) ON CONFLICT (hash) DO
UPDATE
SET portfolio_id = EXCLUDED.portfolio_id,
    asset = EXCLUDED.asset,
    amount = EXCLUDED.amount,
    fee = EXCLUDED.fee,
    time = EXCLUDED.time,
    type = EXCLUDED.type;
END LOOP;
END;
$$ LANGUAGE plpgsql