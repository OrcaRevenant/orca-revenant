import { Module } from "@nestjs/common";
import { ConnectionController } from "./connection.controller";
import { ConnectionService } from "./connection.service";
import { NobitexModule } from "src/nobitex/nobitex.module";
import { ConnectionFactory } from "./connection.factory";

@Module({
  imports: [NobitexModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionFactory],
})
export class ConnectionModule {}
