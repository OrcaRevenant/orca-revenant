import { Module } from "@nestjs/common";
import { ConnectionController } from "./connection.controller";
import { ConnectionService } from "./connection.service";
import { NobitexConnectionModule } from "src/nobitex-connection/nobitex-connection.module";
import { ConnectionFactory } from "./connection.factory";

@Module({
  imports: [NobitexConnectionModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionFactory],
})
export class ConnectionModule {}
