import { Module } from "@nestjs/common";
import { MockService } from "./mock.service";

@Module({
  providers: [{ provide: "PriceProvider", useClass: MockService }],
  exports: ["PriceProvider"],
})
export class MockModule {}
