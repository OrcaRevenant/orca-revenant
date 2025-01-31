import { Injectable, NotFoundException } from "@nestjs/common";
import { ConnectionAbstract } from "./connection.abstract";
import { NobitexConnectionService } from "@/nobitex-connection/nobitex-connection.service";
import { MockConnectionService } from "@/mock-connection/mock-connection.service";

@Injectable()
export class ConnectionFactory {
    constructor(
        private readonly nobitexService: NobitexConnectionService,
        private readonly mockService: MockConnectionService,
    ) {}

    getConnection(connectionId: string): ConnectionAbstract {
        switch (connectionId) {
            case "mock":
                return this.mockService;
            case "nobitex":
                return this.nobitexService;
            default:
                throw new NotFoundException(
                    `Connection with ID "${connectionId}" not found.`,
                );
        }
    }
}
