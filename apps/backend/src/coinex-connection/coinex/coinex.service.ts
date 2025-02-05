import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom, Observable } from "rxjs";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import * as crypto from "crypto";
import {
    GetAccountInfo,
    GetSportBalanceResponse,
    GetSpotTransactionsResponse,
    Transaction,
    TransactionType,
} from "./coinex.types";

@Injectable()
export class CoinexService {
    constructor(private readonly httpService: HttpService) {}

    async getSpotBalance(
        apiKey: string,
        secretKey: string,
    ) {
        return this.fetchData<GetSportBalanceResponse>(
            "GET",
            "/v2/assets/spot/balance",
            apiKey,
            secretKey,
        );
    }

    async getSpotTransactions(
        apiKey: string,
        secretKey: string,
        type: TransactionType,
    ) {
        const limit = 1000;
        const allTransactions: Transaction[] = [];

        const fetchPage = async (
            page: number,
        ) => {
            const response = await this.fetchData<GetSpotTransactionsResponse>(
                "GET",
                "/v2/assets/spot/transcation-history",
                apiKey,
                secretKey,
                {
                    params: {
                        type,
                        page,
                        limit,
                    },
                },
            );

            const transactions: Transaction[] = response.data || [];
            allTransactions.push(...transactions);

            if (transactions.length === limit) {
                await fetchPage(page + 1);
            }
        };

        await fetchPage(1);
        return allTransactions;
    }

    async getAccountInfo(
        apiKey: string,
        secretKey: string,
    ) {
        return this.fetchData<GetAccountInfo>(
            "GET",
            "/v2/account/info",
            apiKey,
            secretKey,
        );
    }

    private async fetchData<T>(
        method: string,
        url: string,
        apiKey: string,
        secretKey: string,
        options: AxiosRequestConfig = {},
    ): Promise<T> {
        const timestamp = Date.now().toString();
        let requestPath = url;
        if (options.params && Object.keys(options.params).length > 0) {
            const queryString = Object.entries(options.params)
                .map(([key, value]) => `${key}=${value}`)
                .join("&");
            requestPath += "?" + queryString;
        }
        const body = options.data
            ? typeof options.data === "string"
                ? options.data
                : JSON.stringify(options.data)
            : "";

        const preparedStr = method.toUpperCase() + requestPath + body +
            timestamp;

        const signature = crypto
            .createHmac("sha256", Buffer.from(secretKey, "latin1"))
            .update(Buffer.from(preparedStr, "latin1"))
            .digest("hex")
            .toLowerCase();

        const headers = {
            "X-COINEX-KEY": apiKey,
            "X-COINEX-SIGN": signature,
            "X-COINEX-TIMESTAMP": timestamp,
            ...(options.headers || {}),
        };

        const requestOptions = { ...options, headers };
        let observable: Observable<AxiosResponse<T>>;
        if (method.toUpperCase() === "GET") {
            observable = this.httpService.get<T>(url, requestOptions);
        } else if (method.toUpperCase() === "POST") {
            observable = this.httpService.post<T>(
                url,
                options.data,
                requestOptions,
            );
        } else {
            throw new Error("Unsupported method: " + method);
        }

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
