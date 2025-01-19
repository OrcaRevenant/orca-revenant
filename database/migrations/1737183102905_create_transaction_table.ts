import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.createTable("public.transaction")
		.addColumn(
			"id",
			"bigint",
			(col) => col.generatedByDefaultAsIdentity().notNull().primaryKey(),
		).addColumn("hash", "text", (col) => col.notNull().unique())
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
			"fee",
			"numeric",
			(col) => col.defaultTo(0).check(sql`fee >= 0`),
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
		.addColumn("time", "timestamptz")
		.addColumn(
			"type",
			"text",
			(col) =>
				col.notNull().check(
					sql`type IN ('buy', 'sell', 'withdrawal', 'deposit')`,
				),
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("public.transaction").execute();
}
