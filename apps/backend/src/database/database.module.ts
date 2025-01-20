import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { DatabaseService } from "./database.service";
import databaseConfig from "./database.config";
import { DB } from "@orca/types";

const InjectedConfig = ConfigModule.forFeature(databaseConfig);

@Global()
@Module({
  imports: [InjectedConfig],
  providers: [
    {
      provide: "Pool",
      useFactory: (config: ConfigType<typeof databaseConfig>) => {
        const connectionString = config.url;
        return new Pool({
          connectionString,
        });
      },
      inject: [databaseConfig.KEY],
    },
    {
      provide: "Kysely",

      useFactory: (pool: Pool) => {
        return new Kysely<DB>({
          dialect: new PostgresDialect({
            pool,
          }),
        });
      },
      inject: ["Pool"],
    },
    DatabaseService,
  ],
  exports: ["Kysely", DatabaseService],
})
export class DatabaseModule {}
