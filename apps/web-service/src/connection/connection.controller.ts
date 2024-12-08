import { Controller, Get, Param, Query } from "@nestjs/common";
import { ConnectionService } from "./connection.service";
import { GetAssetsDto } from "./connection.dto";

@Controller("connection")
export class ConnectionController {
    constructor(private readonly connectionService: ConnectionService) {}

    @Get(":connectionId/assets")
    async getAssets(
        @Param("connectionId") connectionId: string,
        @Query() query: GetAssetsDto,
    ) {
        return this.connectionService.getAssets(connectionId, query.apiKey);
    }
}
