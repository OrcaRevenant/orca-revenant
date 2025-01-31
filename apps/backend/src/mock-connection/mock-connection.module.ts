import { Module } from "@nestjs/common";
import { ConnectionAbstract } from "@/connection/connection.abstract";
import { MockConnectionService } from "./mock-connection.service";

@Module({
  imports: [],
  providers: [
    MockConnectionService,
    {
      provide: ConnectionAbstract,
      useExisting: MockConnectionService,
    },
  ],
  exports: [MockConnectionService],
})
export class MockConnectionModule {}
