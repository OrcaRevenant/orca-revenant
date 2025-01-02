import { Module } from "@nestjs/common";
import { NobitexConnectionService } from "./nobitex-connection.service";
import { ConnectionAbstract } from "@/connection/connection.abstract";
import { NobitexModule } from "./nobitex/nobitex.module";

@Module({
  imports: [
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
