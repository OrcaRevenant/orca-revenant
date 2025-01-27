import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await sql`create extension if not exists timescaledb with schema extensions`
		.execute(db);

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

	await sql`SELECT create_hypertable('public.price', 'time')`.execute(db);

	await db.schema
		.createIndex("idx_price_asset_time")
		.on("price")
		.columns(["asset", "time"])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the `price` table
	await db.schema.dropTable("public.price").execute();
}
