import { Injectable, NotFoundException } from "@nestjs/common";
import { ConnectionAbstract } from "./connection.abstract";
import { NobitexService } from "src/nobitex/nobitex.service";

@Injectable()
export class ConnectionFactory {
    constructor(private readonly nobitexService: NobitexService) {}

    getConnection(connectionId: string): ConnectionAbstract {
        switch (connectionId) {
            case "nobitex":
                return this.nobitexService;
            default:
                throw new NotFoundException(
                    `Connection with ID "${connectionId}" not found.`,
                );
        }
    }
}
