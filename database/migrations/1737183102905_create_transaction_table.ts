import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await sql`create extension if not exists timescaledb with schema extensions`
		.execute(db);

	await db.schema
		.createTable("public.transaction")
		.addColumn(
			"id",
			"bigint",
			(col) => col.generatedByDefaultAsIdentity().notNull(),
		)
		.addColumn("hash", "text", (col) => col.notNull())
		.addColumn(
			"portfolio_id",
			"bigint",
			(col) =>
				col.notNull().references("public.portfolio.id").onDelete(
					"cascade",
				),
		)
		.addColumn(
			"asset",
			"text",
			(col) =>
				col.notNull().references("public.asset.symbol").onDelete(
					"cascade",
				),
		)
		.addColumn(
			"amount",
			"numeric",
			(col) => col.defaultTo(0).check(sql`amount >= 0`),
		)
		.addColumn(
			"value",
			"numeric",
			(col) => col.defaultTo(0).check(sql`value >= 0`),
		)
		.addColumn("time", "timestamptz", (col) => col.notNull())
		.addColumn(
			"type",
			"text",
			(col) =>
				col.notNull().check(
					sql`type IN ('buy', 'sell', 'withdrawal', 'deposit')`,
				),
		)
		.addPrimaryKeyConstraint("transaction_pkey", ["id", "time"])
		.addUniqueConstraint("transaction_hash_time_unique", ["hash", "time"])
		.execute();

	await sql`select create_hypertable('public.transaction', 'time');`.execute(
		db,
	);

	await db.schema
		.createIndex("idx_transaction_portfolio_time")
		.on("public.transaction")
		.columns(["portfolio_id", "time"])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("public.transaction").execute();
}
