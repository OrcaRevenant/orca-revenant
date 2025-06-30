import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import nobitexConfig from "./nobitex.config";

interface NobitexCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface FetchCandlesParams {
  symbol: string;
  resolution: string;
  from: number;
  to: number;
}

interface SymbolConfig {
  flip: boolean;
  symbol?: string;
}

export class NobitexClient {
  private readonly MAX_CANDLES_PER_REQUEST = 500;
  private readonly CONCURRENT_REQUESTS = 5;

  private readonly symbolConfig: Record<string, SymbolConfig> = {};

  constructor(
    private readonly httpService: HttpService,
    @Inject(nobitexConfig.KEY)
    private readonly config: ConfigType<typeof nobitexConfig>
  ) {
    if (this.config.symbolMappings) {
      for (const [symbol, config] of Object.entries(
        this.config.symbolMappings
      )) {
        this.symbolConfig[symbol] = config;
      }
    }
  }

  async fetchAllCandles(
    symbol: string,
    resolution: string,
    fromDate: number,
    toDate: number
  ): Promise<NobitexCandle[]> {
    const resolutionInSeconds = this.resolutionToSeconds(resolution);
    const timePerInterval = resolutionInSeconds * this.MAX_CANDLES_PER_REQUEST;

    const intervals = this.generateTimeIntervals(
      fromDate,
      toDate,
      timePerInterval
    );

    const { symbol: mappedSymbol, flip } = this.getSymbolConfig(symbol);
    const requestSymbol = mappedSymbol || symbol;

    const intervalChunks = this.chunkArray(intervals, this.CONCURRENT_REQUESTS);
    let allCandles: NobitexCandle[] = [];

    for (let i = 0; i < intervalChunks.length; i++) {
      const currentChunk = intervalChunks[i];
      console.log(
        `Processing chunk ${i + 1}/${intervalChunks.length} for ${symbol}`
      );

      const chunkResults = await Promise.all(
        currentChunk.map((interval) => {
          return this.fetchCandlesWithRetry(
            requestSymbol,
            resolution,
            interval.from,
            interval.to
          );
        })
      );

      const chunkCandles = this.flattenArray(chunkResults);

      const processedCandles = flip
        ? this.flipCandlePrices(chunkCandles)
        : chunkCandles;

      allCandles = [...allCandles, ...processedCandles];
      allCandles = this.sortCandles(allCandles);
    }

    return allCandles;
  }

  private getSymbolConfig(symbol: string): SymbolConfig {
    return this.symbolConfig[symbol] || { flip: false };
  }

  private flipCandlePrices(candles: NobitexCandle[]): NobitexCandle[] {
    return candles.map((candle) => ({
      ...candle,
      open: this.flipPrice(candle.open),
      high: this.flipPrice(candle.low),
      low: this.flipPrice(candle.high),
      close: this.flipPrice(candle.close),
    }));
  }

  private flipPrice(price: number): number {
    if (price === 0) {
      console.warn("Encountered zero price when flipping, returning 0");
      return 0;
    }
    return 1 / price;
  }

  private async fetchCandlesWithRetry(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
    retries = 3
  ): Promise<NobitexCandle[]> {
    try {
      return await this.fetchCandles({ symbol, resolution, from, to });
    } catch (error) {
      if (retries > 0) {
        const delay = 1000 * (4 - retries);
        console.warn(
          `Error fetching candles, retrying in ${delay}ms. Retries left: ${
            retries - 1
          }`
        );
        await this.delay(delay);
        return this.fetchCandlesWithRetry(
          symbol,
          resolution,
          from,
          to,
          retries - 1
        );
      }

      console.error(
        `Failed to fetch candles after multiple retries: ${error.message}`
      );
      throw error;
    }
  }

  private async fetchCandles(
    params: FetchCandlesParams
  ): Promise<NobitexCandle[]> {
    try {
      const { symbol, resolution, from, to } = params;

      const response = await firstValueFrom(
        this.httpService.get("https://api.nobitex.ir/market/udf/history", {
          params: {
            symbol,
            resolution,
            from,
            to,
          },
        })
      );

      const data = response.data as any;

      if (data && data.s === "ok" && Array.isArray(data.t)) {
        const candles: NobitexCandle[] = [];

        for (let i = 0; i < data.t.length; i++) {
          candles.push({
            timestamp: data.t[i],
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v[i],
          });
        }

        return candles;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`Error fetching candles: ${error.message}`);
      throw error;
    }
  }

  private generateTimeIntervals(
    fromDate: number,
    toDate: number,
    intervalSize: number
  ) {
    const intervals = [];
    let currentFrom = fromDate;

    while (currentFrom < toDate) {
      const currentTo = Math.min(currentFrom + intervalSize - 1, toDate);
      intervals.push({ from: currentFrom, to: currentTo });
      currentFrom = currentTo + 1;
    }

    return intervals;
  }

  private resolutionToSeconds(resolution: string): number {
    const value = parseInt(resolution);
    const unit = resolution.replace(/[0-9]/g, "");

    switch (unit) {
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      case "w":
        return value * 7 * 24 * 60 * 60;
      case "M":
        return value * 30 * 24 * 60 * 60;
      default:
        return value;
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    if (chunkSize <= 0) {
      throw new Error("Chunk size must be greater than 0");
    }

    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  private flattenArray<T>(arrays: T[][]): T[] {
    return arrays.reduce((result, current) => result.concat(current), []);
  }

  private sortCandles(candles: NobitexCandle[]): NobitexCandle[] {
    return [...candles].sort((a, b) => a.timestamp - b.timestamp);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
