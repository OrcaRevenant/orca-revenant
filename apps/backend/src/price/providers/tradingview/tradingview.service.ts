import { Injectable, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { HistoricalPrice, PriceAbstract } from "../../price.abstract";
import { ConfigType } from "@nestjs/config";
import tradingViewConfig from "./tradingview.config";

@Injectable()
export class TradingViewService extends PriceAbstract {
  constructor(
    @Inject(tradingViewConfig.KEY)
    private readonly config: ConfigType<typeof tradingViewConfig>,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async getAssetHistoricalPrice(
    asset: string,
    from: Date,
    to: Date,
    resolution: number,
  ): Promise<HistoricalPrice[]> {
    if (!this.config.apiKey) {
      throw new HttpException(
        "TradingView API key not set",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const fromUnix = Math.floor(from.getTime() / 1000);
    const toUnix = Math.floor(to.getTime() / 1000);

    const params = {
      symbol: asset,
      resolution: resolution,
      from: fromUnix,
      to: toUnix,
      token: this.config.apiKey,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}/history`, { params }),
      );
      const data = response.data;

      if (data.s !== "ok") {
        throw new HttpException(
          `Invalid response from TradingView API: ${data.s}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const prices: HistoricalPrice[] = data.t.map(
        (timestamp: number, index: number) => ({
          time: new Date(timestamp * 1000).toISOString(),
          price: parseFloat(data.c[index]),
          asset,
        }),
      );

      return prices;
    } catch (error: any) {
      console.error("TradingView API error:", error.message);
      throw new HttpException(
        "Failed to fetch historical crypto price data from TradingView",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
