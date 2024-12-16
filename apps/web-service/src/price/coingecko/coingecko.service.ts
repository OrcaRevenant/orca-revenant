import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { AxiosError, AxiosResponse } from "axios";
import { catchError, firstValueFrom, Observable } from "rxjs";
import { CryptoAssetListResponse, PriceResponse } from "./coingecko.types";
import coingeckoConfig from "./coingecko.config";
import { ConfigType } from "@nestjs/config";

@Injectable()
export class CoingeckoService {
    constructor(
        @Inject(coingeckoConfig.KEY) private readonly config: ConfigType<
            typeof coingeckoConfig
        >,
        private readonly httpService: HttpService,
    ) {}

    async fetchPrice(assets: string[]): Promise<PriceResponse> {
        const response = await this.handleRequest(
            this.httpService.get<PriceResponse>("/v3/simple/price", {
                params: {
                    ids: assets.join(","),
                    vs_currencies: "usd",
                },
                headers: {
                    "x-cg-demo-api-key": this.config.apiKey,
                },
            }),
        );
        return response.data;
    }

    async fetchHistoricalPrice(
        coinIds: string[],
        date: Date,
    ): Promise<Record<string, { usd: number }>> {
        const formattedDate = this.formatDateForCoingecko(date);
        const promises = coinIds.map((coinId) =>
            this.fetchSingleCoinHistoricalPrice(coinId, formattedDate)
        );

        const results = await Promise.allSettled(promises);

        return coinIds.reduce((acc, coinId, index) => {
            const result = results[index];
            if (result.status === "fulfilled") {
                acc[coinId] = { usd: result.value };
            } else {
                console.error(
                    `Failed to fetch historical price for ${coinId}:`,
                    result.reason,
                );
            }
            return acc;
        }, {} as Record<string, { usd: number }>);
    }

    private async fetchSingleCoinHistoricalPrice(
        coinId: string,
        date: string,
    ): Promise<number> {
        const response = await this.handleRequest(
            this.httpService.get(
                `v3/coins/${coinId}/history`,
                {
                    params: {
                        date,
                        localization: false,
                    },
                    headers: {
                        "x-cg-demo-api-key": this.config.apiKey,
                    },
                },
            ),
        );

        const price = response.data.market_data?.current_price?.usd;
        return price;
    }

    async fetchCoinsList(): Promise<CryptoAssetListResponse> {
        const response = await this.handleRequest(
            this.httpService.get<CryptoAssetListResponse>("/v3/coins/list", {
                headers: {
                    "x-cg-demo-api-key": this.config.apiKey,
                },
            }),
        );
        return response.data;
    }

    private async handleRequest<T>(
        request: Observable<AxiosResponse<T>>,
    ): Promise<AxiosResponse<T>> {
        return firstValueFrom(
            request.pipe(
                catchError((error: AxiosError) => {
                    throw new Error(`Request failed: ${error.message}`);
                }),
            ),
        );
    }

    private formatDateForCoingecko(date: Date): string {
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();
        return `${day}-${month}-${year}`;
    }
}
