import { Injectable } from "@nestjs/common";
import { ConnectionRepository } from "./connection.repository";

@Injectable()
export class ConnectionService {
    constructor(
        private readonly connectionRepository: ConnectionRepository,
    ) {}

    async getAll() {
        return this.connectionRepository.findAll();
    }

    async getByName(name: string) {
        return this.connectionRepository.findByName(name);
    }
}
