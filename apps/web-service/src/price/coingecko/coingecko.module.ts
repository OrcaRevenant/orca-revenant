import { Module } from "@nestjs/common";
import { CoingeckoService } from "./coingecko.service";
import { ConfigModule, ConfigType } from "@nestjs/config";
import coingeckoConfig from "./coingecko.config";
import { HttpModule } from "@nestjs/axios";

const InjectedConfig = ConfigModule.forFeature(coingeckoConfig);

@Module({
  imports: [
    InjectedConfig,
    HttpModule.registerAsync({
      imports: [InjectedConfig],
      useFactory: (config: ConfigType<typeof coingeckoConfig>) => {
        return {
          baseURL: config.baseUrl,
        };
      },
      inject: [coingeckoConfig.KEY],
    }),
  ],
  providers: [CoingeckoService],
  exports: [CoingeckoService],
})
export class CoingeckoModule {}
