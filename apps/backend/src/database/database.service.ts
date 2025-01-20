import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { DB } from "@orca/types";
import { Kysely } from "kysely";
import databaseConfig from "./database.config";
import { ConfigType } from "@nestjs/config";
import { Pool } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject(databaseConfig.KEY) private readonly config: ConfigType<
            typeof databaseConfig
        >,
        @Inject("Kysely") public readonly query: Kysely<DB>,
        @Inject("Pool") public readonly pool: Pool,
    ) {
    }

    onModuleInit() {
        console.log("Database connection initialized");
    }

    async onModuleDestroy() {
        await this.query.destroy();
        console.log("Database connection closed");
    }
}
