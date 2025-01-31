import { Module } from "@nestjs/common";
import { ConnectionController } from "./connection.controller";
import { ConnectionService } from "./connection.service";
import { ConnectionRepository } from "./connection.repository";
import { NobitexConnectionModule } from "@/nobitex-connection/nobitex-connection.module";
import { ConnectionFactory } from "./connection.factory";
import { DatabaseModule } from "@/database/database.module";
import { MockConnectionModule } from "@/mock-connection/mock-connection.module";

@Module({
  imports: [NobitexConnectionModule, MockConnectionModule, DatabaseModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionFactory, ConnectionRepository],
  exports: [ConnectionService, ConnectionFactory, ConnectionRepository],
})
export class ConnectionModule {}
