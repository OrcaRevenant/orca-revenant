import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ConnectionService } from "./connection.service";
import { JwtGuard } from "@/auth/jwt.guard";

@Controller("connections")
export class ConnectionController {
    constructor(private readonly connectionService: ConnectionService) {}

    @Get()
    @UseGuards(JwtGuard)
    async getAll() {
        return this.connectionService.getAll();
    }

    @Get(":name")
    @UseGuards(JwtGuard)
    async getById(@Param("name") name: string) {
        return this.connectionService.getByName(name);
    }
}
