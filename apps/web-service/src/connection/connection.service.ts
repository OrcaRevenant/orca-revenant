import { Injectable } from "@nestjs/common";
import { ConnectionFactory } from "./connection.factory";

@Injectable()
export class ConnectionService {
    constructor(private readonly connectionFactory: ConnectionFactory) {}

    async getAssets(connectionId: string, apiKey: string) {
        const connection = this.connectionFactory.getConnection(connectionId);
        return connection.getTransactions(apiKey);
    }
}
