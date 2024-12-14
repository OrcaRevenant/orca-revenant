import { Module } from "@nestjs/common";
import { NobitexService } from "./nobitex.service";
import { ConfigModule, ConfigType } from "@nestjs/config";
import nobitexConnectionConfig from "../nobitex-connection.config";
import { HttpModule } from "@nestjs/axios";

const InjectedConfig = ConfigModule.forFeature(nobitexConnectionConfig);

@Module({
  imports: [
    ConfigModule.forFeature(nobitexConnectionConfig),
    HttpModule.registerAsync({
      imports: [InjectedConfig],
      useFactory: (config: ConfigType<typeof nobitexConnectionConfig>) => {
        return {
          baseURL: config.baseUrl, // TODO: fix config and env manager in turbo repo
        };
      },
      inject: [nobitexConnectionConfig.KEY],
    }),
  ],
  providers: [NobitexService],
  exports: [NobitexService],
})
export class NobitexModule {}
