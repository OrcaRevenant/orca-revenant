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
      provide: "Kysely",
      useFactory: (config: ConfigType<typeof databaseConfig>) => {
        const connectionString = config.url;
        return new Kysely<DB>({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString,
            }),
          }),
        });
      },
      inject: [databaseConfig.KEY],
    },
    DatabaseService,
  ],
  exports: ["Kysely", DatabaseService],
})
export class DatabaseModule {}
