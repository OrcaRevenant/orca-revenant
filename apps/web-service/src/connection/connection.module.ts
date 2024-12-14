import { Module } from "@nestjs/common";
import { ConnectionService } from "./connection.service";
import { NobitexConnectionModule } from "@/nobitex-connection/nobitex-connection.module";
import { ConnectionFactory } from "./connection.factory";
import { SupabaseModule } from "@/supabase/supabase.module";

@Module({
  imports: [NobitexConnectionModule, SupabaseModule],
  providers: [ConnectionService, ConnectionFactory],
  exports: [ConnectionService],
  controllers: [],
})
export class ConnectionModule {}
