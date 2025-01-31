import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Create the "connection" table
	await db.schema
		.createTable("public.connection")
		.addColumn("name", "text", (col) => col.notNull().primaryKey())
		.addColumn(
			"title",
			"varchar(255)",
			(col) => col.notNull(),
		)
		.addColumn(
			"type",
			"text",
			(col) => col.notNull().check(sql`type IN ('CEX', 'DEX')`),
		)
		.addColumn(
			"logo",
			"text",
			(col) => col.check(sql`logo ~ '^https?://.*$'`),
		)
		.addColumn("description", "text", (col) => col)
		.addColumn(
			"enabled",
			"boolean",
			(col) => col.notNull().defaultTo(false),
		)
		.addColumn(
			"created_at",
			"timestamptz",
			(col) => col.notNull().defaultTo(sql`NOW()`),
		)
		.execute();

	await db.schema
		.createTable("public.portfolio_group")
		.addColumn("id", "bigserial", (col) => col.notNull().primaryKey())
		.addColumn("user_id", "uuid", (col) =>
			col
				.notNull()
				.references("auth.users.id")
				.onDelete("cascade")
				.defaultTo(sql`auth.uid()`))
		.addColumn("title", "varchar(255)", (col) => col.notNull())
		.addColumn("parent_id", "bigint", (col) =>
			col
				.defaultTo(null)
				.references("public.portfolio_group.id")
				.onDelete("cascade"))
		.addColumn(
			"color",
			"text",
			(col) =>
				col.notNull().defaultTo("#000000").check(
					sql`color ~ '^#[0-9A-Fa-f]{6}$'`,
				),
		)
		.addColumn(
			"created_at",
			"timestamptz",
			(col) => col.notNull().defaultTo(sql`NOW()`),
		)
		.execute();

	// Create Portfolio
	await db.schema
		.createTable("public.portfolio")
		.addColumn("id", "bigserial", (col) => col.notNull().primaryKey())
		.addColumn(
			"connection_name",
			"text",
			(col) =>
				col.notNull().references("public.connection.name").onDelete(
					"cascade",
				),
		)
		.addColumn("user_id", "uuid", (col) =>
			col
				.notNull()
				.references("auth.users.id")
				.onDelete("cascade")
				.defaultTo(sql`auth.uid()`))
		.addColumn(
			"group_id",
			"bigint",
			(col) =>
				col.defaultTo(null).references("public.portfolio_group.id")
					.onDelete("cascade"),
		)
		.addColumn("title", "varchar(255)", (col) => col.notNull())
		.addColumn("api_key", "text", (col) => col.notNull())
		.addColumn(
			"color",
			"text",
			(col) =>
				col.notNull().defaultTo("#000000").check(
					sql`color ~ '^#[0-9A-Fa-f]{6}$'`,
				),
		)
		.addColumn(
			"created_at",
			"timestamptz",
			(col) => col.notNull().defaultTo(sql`NOW()`),
		)
		.addColumn(
			"disabled",
			"boolean",
			(col) => col.notNull().defaultTo(false),
		)
		.addColumn("status", "text", (col) =>
			col
				.notNull()
				.defaultTo("unknown")
				.check(
					sql`status IN ('active', 'inactive', 'syncing', 'unknown')`,
				))
		.addColumn("last_sync_at", "timestamptz")
		.execute();

	// Create Portfolio Assets
	await db.schema
		.createTable("public.portfolio_assets")
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
			(col) => col.notNull().defaultTo(0).check(sql`amount >= 0`),
		)
		.addPrimaryKeyConstraint(`portfolio_assets_pkey`, [
			"portfolio_id",
			"asset",
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("public.portfolio_assets").execute();
	await db.schema.dropTable("public.portfolio").execute();
	await db.schema.dropTable("public.connection").execute();
}
