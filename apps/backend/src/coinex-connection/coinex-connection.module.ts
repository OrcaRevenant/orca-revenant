import { Module } from "@nestjs/common";
import { CoinexConnectionService } from "./coinex-connection.service";
import { ConnectionAbstract } from "@/connection/connection.abstract";
import { CoinexModule } from "./coinex/coinex.module";

@Module({
  imports: [
    CoinexModule,
  ],
  providers: [
    CoinexConnectionService,
    {
      provide: ConnectionAbstract,
      useExisting: CoinexConnectionService,
    },
  ],
  exports: [CoinexConnectionService],
})
export class CoinexConnectionModule {}
