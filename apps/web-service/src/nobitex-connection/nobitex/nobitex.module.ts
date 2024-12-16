import { Module } from "@nestjs/common";
import { NobitexService } from "./nobitex.service";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import nobitexConfig from "./nobitex.config";

const InjectedConfig = ConfigModule.forFeature(nobitexConfig);

@Module({
  imports: [
    InjectedConfig,
    HttpModule.registerAsync({
      imports: [InjectedConfig],
      useFactory: (config: ConfigType<typeof nobitexConfig>) => {
        return {
          baseURL: config.baseUrl,
        };
      },
      inject: [nobitexConfig.KEY],
    }),
  ],
  providers: [NobitexService],
  exports: [NobitexService],
})
export class NobitexModule {}
