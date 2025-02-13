import { Injectable, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { HistoricalPrice, PriceAbstract } from "../../price.abstract";
import { ConfigType } from "@nestjs/config";
import alphaVentageConfig from "./alpha-ventage.config";
import { aggregatePriceData } from "../../price.utils";

@Injectable()
export class AlphaVantageService extends PriceAbstract {
  constructor(
    @Inject(alphaVentageConfig.KEY)
    private readonly config: ConfigType<typeof alphaVentageConfig>,
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
        "AlphaVantage API key not set",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const params = {
      function: "CRYPTO_INTRADAY",
      symbol: asset,
      market: "USD",
      interval: "1min",
      outputsize: "full",
      apikey: this.config.apiKey,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.config.baseUrl, { params }),
      );
      const data = response.data;

      console.log(data);

      const timeSeriesKey = "Time Series Crypto (1min)";
      const timeSeriesData = data[timeSeriesKey];

      if (!timeSeriesData) {
        throw new HttpException(
          "Invalid response from AlphaVantage API",
          HttpStatus.BAD_GATEWAY,
        );
      }

      const prices: HistoricalPrice[] = Object.entries(timeSeriesData)
        .filter(([timestamp]) => {
          const dateTime = new Date(timestamp);
          return dateTime >= from && dateTime <= to;
        })
        .map(([timestamp, priceData]) => ({
          time: new Date(timestamp).toISOString(),
          price: parseFloat(priceData["4. close"]),
          asset,
        }));

      return aggregatePriceData(prices, resolution);
    } catch (error) {
      console.error("AlphaVantage API error:", error.message);
      throw new HttpException(
        "Failed to fetch historical crypto price data from AlphaVantage",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
