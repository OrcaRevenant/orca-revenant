import { Module } from "@nestjs/common";
import { CoinexService } from "./coinex.service";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import coinexConfig from "./coinex.config";

const InjectedConfig = ConfigModule.forFeature(coinexConfig);

@Module({
  imports: [
    InjectedConfig,
    HttpModule.registerAsync({
      imports: [InjectedConfig],
      useFactory: (config: ConfigType<typeof coinexConfig>) => {
        return {
          baseURL: config.baseUrl,
        };
      },
      inject: [coinexConfig.KEY],
    }),
  ],
  providers: [CoinexService],
  exports: [CoinexService],
})
export class CoinexModule {}
