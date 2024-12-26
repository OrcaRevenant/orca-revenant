import { Module } from "@nestjs/common";
import { ConnectionController } from "./connection.controller";
import { ConnectionService } from "./connection.service";
import { ConnectionRepository } from "./connection.repository";
import { SupabaseModule } from "@/common/supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionRepository],
  exports: [ConnectionService],
})
export class ConnectionModule {}
