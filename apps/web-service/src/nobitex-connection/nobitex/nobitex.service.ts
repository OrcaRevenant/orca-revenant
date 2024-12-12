import { Inject, Injectable } from "@nestjs/common";
import nobitexConnectionConfig from "../nobitex-connection.config";
import { ConfigType } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import {
    NobitexOptionsResponse,
    TransactionsResponse,
    WalletsResponse,
} from "./nobitex.types";
import { catchError, firstValueFrom, Observable } from "rxjs";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

@Injectable()
export class NobitexService {
    constructor(
        @Inject(nobitexConnectionConfig.KEY) private readonly config:
            ConfigType<typeof nobitexConnectionConfig>,
        private readonly httpService: HttpService,
    ) {}

    async getProfile(apiKey: string) {
        return this.fetchData<WalletsResponse>(`/users/profile`, apiKey);
    }

    async getWallets(apiKey: string) {
        return this.fetchData<WalletsResponse>(`/v2/wallets`, apiKey, {
            params: { type: "spot" },
        });
    }

    async getAvailableAssets(apiKey: string) {
        return this.fetchData<NobitexOptionsResponse>(`/v2/options`, apiKey);
    }

    async getTransactions(
        apiKey: string,
        wallet: number,
        page = 1,
    ): Promise<any[]> {
        const pageSize = 100;
        const response = await this.fetchData<TransactionsResponse>(
            `/users/wallets/transactions/list`,
            apiKey,
            {
                params: { page, pageSize, wallet },
            },
        );

        const transactions = response.transactions;

        if (transactions.length === pageSize) {
            const nextPageTransactions = await this.getTransactions(
                apiKey,
                wallet,
                page + 1,
            );
            transactions.push(...nextPageTransactions);
        }

        return transactions;
    }

    private async fetchData<T>(
        url: string,
        apiKey: string,
        options: AxiosRequestConfig = {},
    ): Promise<T> {
        const observable = this.httpService.get<T>(url, {
            headers: { Authorization: `Token ${apiKey}`, ...options.headers },
            ...options,
        });

        const { data } = await this.handleRequest(observable);
        return data;
    }

    private handleRequest<T>(
        request: Observable<AxiosResponse<T>>,
    ): Promise<AxiosResponse<T>> {
        return firstValueFrom(
            request.pipe(
                catchError((error: AxiosError) => {
                    throw error;
                }),
            ),
        );
    }
}
