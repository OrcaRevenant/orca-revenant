import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { DB } from "@orca/types";
import { Kysely } from "kysely";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    constructor(@Inject("Kysely") public readonly query: Kysely<DB>) {
    }

    onModuleInit() {
        console.log("Database connection initialized");
    }

    async onModuleDestroy() {
        await this.query.destroy();
        console.log("Database connection closed");
    }
}
