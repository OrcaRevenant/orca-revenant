import { Injectable } from "@nestjs/common";
import { ConnectionFactory } from "./connection.factory";
import { Asset } from "./connection.abstract";

@Injectable()
export class ConnectionService {
    constructor(private readonly connectionFactory: ConnectionFactory) {}

    async getAssets(connectionId: string, apiKey: string): Promise<Asset[]> {
        const connection = this.connectionFactory.getConnection(connectionId);
        return connection.getAssets(apiKey);
    }
}
