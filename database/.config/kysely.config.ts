import { PostgresDialect } from "kysely";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";

export default defineConfig({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString:
				"postgresql://postgres:postgres@127.0.0.1:54322/postgres",
		}),
	}),
	migrations: {
		migrationFolder: "migrations",
	},
	seeds: {
		seedFolder: "seeds",
	},
	plugins: [],
});
