import { Module } from "@nestjs/common";
import { NobitexService } from "./nobitex.service";
import { ConfigModule, ConfigType } from "@nestjs/config";
import nobitexConfig from "./nobitex.config";
import { HttpModule } from "@nestjs/axios";
import { ConnectionAbstract } from "src/connection/connection.abstract";

const InjectedConfig = ConfigModule.forFeature(nobitexConfig);

@Module({
  imports: [
    ConfigModule.forFeature(nobitexConfig),
    HttpModule.registerAsync({
      imports: [InjectedConfig],
      useFactory: (config: ConfigType<typeof nobitexConfig>) => {
        return {
          baseURL: `https://api.nobitex.ir`, // TODO: fix config and env manager in turbo repo
        };
      },
      inject: [nobitexConfig.KEY],
    }),
  ],
  providers: [
    NobitexService,
    {
      provide: ConnectionAbstract,
      useExisting: NobitexService,
    },
  ],
  exports: [NobitexService],
})
export class NobitexModule {}
