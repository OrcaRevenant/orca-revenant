import { PostgresDialect } from "kysely";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:your-super-secret-and-long-postgres-password@127.0.0.1:5433/postgres",
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
