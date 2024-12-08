import { Inject, Injectable } from "@nestjs/common";
import { Asset, ConnectionAbstract } from "src/connection/connection.abstract";
import nobitexConfig from "./nobitex.config";
import { ConfigType } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { AxiosError, AxiosResponse } from "axios";
import { NobitexMarketStatsResponse } from "./nobitex.types";
import { catchError, firstValueFrom, Observable } from "rxjs";

// 87b43f761d0703ce217ade970887a2e0623a2d0d
@Injectable()
export class NobitexService implements ConnectionAbstract {
    constructor(
        @Inject(nobitexConfig.KEY) private config: ConfigType<
            typeof nobitexConfig
        >,
        private readonly httpService: HttpService,
    ) {}

    async getAssets(apiKey: string): Promise<Asset[]> {
        const observable = this.httpService.get<NobitexMarketStatsResponse>(
            `/market/stats`,
            {
                headers: {
                    Authorization: `Token ${apiKey}`,
                },
            },
        );

        const { data } = await this.handleRequest(observable);

        return Object.keys(data.stats).map((pair) => {
            const symbol = pair.split(`-`)[0];
            return {
                id: symbol,
                name: symbol,
                symbol,
            };
        });
    }

    private handleRequest<T>(request: Observable<AxiosResponse<T>>) {
        const observed = request.pipe(
            catchError((error: AxiosError) => {
                throw error;
            }),
        );

        return firstValueFrom(observed);
    }
}
