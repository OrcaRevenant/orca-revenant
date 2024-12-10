import { Module } from "@nestjs/common";
import { NobitexConnectionService } from "./nobitex-connection.service";
import { ConnectionAbstract } from "src/connection/connection.abstract";
import { SupabaseModule } from "src/supabase/supabase.module";
import { NobitexModule } from "./nobitex/nobitex.module";

@Module({
  imports: [
    SupabaseModule,
    NobitexModule,
  ],
  providers: [
    NobitexConnectionService,
    {
      provide: ConnectionAbstract,
      useExisting: NobitexConnectionService,
    },
  ],
  exports: [NobitexConnectionService],
})
export class NobitexConnectionModule {}
