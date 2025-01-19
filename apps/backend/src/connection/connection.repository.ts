import { Injectable } from "@nestjs/common";
import { Connection } from "./connection.types";
import { DatabaseService } from "@/database/database.service";

@Injectable()
export class ConnectionRepository {
    constructor(private readonly db: DatabaseService) {}

    private serialize(connection: any): Connection {
        return {
            created_at: connection.created_at,
            description: connection.description,
            enabled: connection.enabled,
            logo: connection.logo,
            name: connection.name,
            title: connection.title,
            type: connection.type,
        };
    }

    async findAll(): Promise<Connection[]> {
        const results = await this.db.query
            .selectFrom("connection")
            .selectAll()
            .execute();

        return results.map(this.serialize);
    }

    async findOne(name: string): Promise<Connection> {
        const result = await this.db.query
            .selectFrom("connection")
            .selectAll()
            .where("name", "=", name)
            .executeTakeFirst();

        if (!result) {
            throw new Error(`Connection with name '${name}' not found.`);
        }

        return this.serialize(result);
    }
}
