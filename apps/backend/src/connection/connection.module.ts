import { Module } from "@nestjs/common";
import { ConnectionController } from "./connection.controller";
import { ConnectionService } from "./connection.service";
import { ConnectionRepository } from "./connection.repository";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { NobitexConnectionModule } from "@/nobitex-connection/nobitex-connection.module";
import { ConnectionFactory } from "./connection.factory";

@Module({
  imports: [NobitexConnectionModule, SupabaseModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionFactory, ConnectionRepository],
  exports: [ConnectionService, ConnectionFactory],
})
export class ConnectionModule {}
