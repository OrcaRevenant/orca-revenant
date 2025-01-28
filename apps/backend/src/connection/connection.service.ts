import { Injectable } from "@nestjs/common";
import { ConnectionRepository } from "./connection.repository";

@Injectable()
export class ConnectionService {
    constructor(
        private readonly connectionRepository: ConnectionRepository,
    ) {}

    async findAll() {
        return this.connectionRepository.findAll();
    }

    async findOne(name: string) {
        return this.connectionRepository.findByName(name);
    }
}
