import { Inject, Injectable } from "@nestjs/common";
import nobitexConnectionConfig from "./nobitex.config";
import { ConfigType } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import {
    DepositResponse,
    NobitexOptionsResponse,
    Order,
    OrdersResponse,
    Transaction,
    TransactionsResponse,
    WalletsResponse,
    Withdrawal,
    WithdrawalsResponse,
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

    async getDeposits(
        apiKey: string,
        page: number = 1,
    ) {
        const pageSize = 100;
        const response = await this.fetchData<DepositResponse>(
            `/users/wallets/deposits/list`,
            apiKey,
            {
                params: {
                    page,
                    pageSize: String(pageSize),
                },
            },
        );

        const deposits = response.deposits;

        if (response.hasNext) {
            const nextPageDeposits = await this.getDeposits(
                apiKey,
                page + 1,
            );
            deposits.push(...nextPageDeposits);
        }

        return deposits;
    }

    async getWithdrawals(
        apiKey: string,
        page: number = 1,
    ): Promise<Withdrawal[]> {
        const pageSize = 100;
        const response = await this.fetchData<WithdrawalsResponse>(
            `/users/wallets/withdraws/list`,
            apiKey,
            {
                params: {
                    page,
                    pageSize: String(pageSize),
                },
            },
        );

        const withdrawals = response.withdraws;

        if (response.hasNext) {
            const nextPageWithdrawals = await this.getWithdrawals(
                apiKey,
                page + 1,
            );
            withdrawals.push(...nextPageWithdrawals);
        }

        return withdrawals;
    }

    async getOrders(
        apiKey: string,
        status: "all" | "open" | "closed" | "canceled" = "all",
        page: number = 1,
    ): Promise<Order[]> {
        const pageSize = 100;
        const response = await this.fetchData<OrdersResponse>(
            `/market/orders/list`,
            apiKey,
            {
                params: {
                    status,
                    page,
                    tradeType: "spot",
                    details: 2,
                    pageSize: String(pageSize),
                },
            },
        );

        const orders = response.orders;

        if (orders.length === pageSize) {
            const nextPageOrders = await this.getOrders(
                apiKey,
                status,
                page + 1,
            );

            orders.push(...nextPageOrders);
        }

        return orders;
    }

    async getTransactions(
        apiKey: string,
        wallet: number,
        page = 1,
    ): Promise<Transaction[]> {
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
