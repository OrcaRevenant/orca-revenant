import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.createTable("public.asset")
		.addColumn("symbol", "text", (col) => col.notNull().primaryKey())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn(
			"logo",
			"text",
			(col) => col.check(sql`logo ~ '^https?://.*$'`),
		)
		.addColumn("alt_names", sql`text[]`, (col) => col.defaultTo(sql`'{}'`))
		.execute();

	await db.schema.createTable("public.asset_info")
		.addColumn(
			"asset",
			"text",
			(col) =>
				col.notNull().references("asset.symbol").onDelete("cascade"),
		)
		.addColumn(
			"listed_at",
			"timestamptz",
			(col) => col.defaultTo(sql`current_timestamp`),
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("public.asset").execute();
}
