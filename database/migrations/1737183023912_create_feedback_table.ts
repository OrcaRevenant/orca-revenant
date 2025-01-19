import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("public.feedback")
		.addColumn(
			"id",
			"bigint",
			(col) => col.generatedByDefaultAsIdentity().notNull().primaryKey(),
		)
		.addColumn(
			"user_id",
			"uuid",
			(col) =>
				col.references("auth.users.id").onDelete("set null").defaultTo(
					sql`auth.uid()`,
				),
		)
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("content", "text", (col) => col.notNull())
		.addColumn(
			"created_at",
			"timestamptz",
			(col) => col.defaultTo(sql`current_timestamp`),
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("public.feedback").execute();
}
