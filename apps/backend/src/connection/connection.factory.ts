import { Injectable, NotFoundException } from "@nestjs/common";
import { ConnectionAbstract } from "./connection.abstract";
import { NobitexConnectionService } from "@/nobitex-connection/nobitex-connection.service";
import { MockConnectionService } from "@/mock-connection/mock-connection.service";
import { CoinexConnectionService } from "@/coinex-connection/coinex-connection.service";

@Injectable()
export class ConnectionFactory {
    constructor(
        private readonly nobitexService: NobitexConnectionService,
        private readonly mockService: MockConnectionService,
        private readonly coinexService: CoinexConnectionService,
    ) {}

    getConnection(connectionId: string): ConnectionAbstract {
        switch (connectionId) {
            case "mock":
                return this.mockService;
            case "nobitex":
                return this.nobitexService;
            case "coinex":
                return this.coinexService;
            default:
                throw new NotFoundException(
                    `Connection with ID "${connectionId}" not found.`,
                );
        }
    }
}
