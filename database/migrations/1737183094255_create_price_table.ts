import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Ensure the timescaledb extension is installed
	await sql`CREATE EXTENSION IF NOT EXISTS timescaledb WITH SCHEMA extensions`
		.execute(db);

	// Create the `price` table
	await db.schema.createTable("public.price")
		.addColumn(
			"asset",
			"text",
			(col) =>
				col.notNull().references("asset.symbol").onDelete("cascade"),
		)
		.addColumn(
			"price",
			"numeric",
			(col) => col.notNull().check(sql`price >= 0`),
		)
		.addColumn(
			"time",
			"timestamptz",
			(col) => col.notNull().defaultTo(sql`now()`),
		)
		.addPrimaryKeyConstraint("price_pkey", ["time", "asset"])
		.execute();

	// Convert the `price` table into a hypertable
	await sql`SELECT create_hypertable('public.price', 'time')`.execute(db);

	// Create a unique index on `asset` and `time`
	await db.schema
		.createIndex("unique_asset_time")
		.on("price")
		.columns(["asset", "time"])
		.unique()
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the `price` table
	await db.schema.dropTable("public.price").execute();
}
