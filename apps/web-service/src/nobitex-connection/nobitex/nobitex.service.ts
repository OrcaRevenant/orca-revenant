import { Inject, Injectable } from "@nestjs/common";
import nobitexConnectionConfig from "../nobitex-connection.config";
import { ConfigType } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import {
    DepositResponse,
    NobitexOptionsResponse,
    TransactionsResponse,
    WalletsResponse,
} from "./nobitex.types";
import { catchError, firstValueFrom, Observable } from "rxjs";
import { AxiosError, AxiosResponse } from "axios";

@Injectable()
export class NobitexService {
    constructor(
        @Inject(nobitexConnectionConfig.KEY) private config: ConfigType<
            typeof nobitexConnectionConfig
        >,
        private readonly httpService: HttpService,
    ) {}

    async getWallets(apiKey: string) {
        const observable = this.httpService.get<WalletsResponse>(
            `/v2/wallets`,
            {
                params: {
                    type: `spot`,
                },
                headers: {
                    Authorization: `Token ${apiKey}`,
                },
            },
        );

        const { data } = await this.handleRequest(observable);
        return data;
    }

    async getAvailableAssets(apiKey: string) {
        const observable = this.httpService.get<NobitexOptionsResponse>(
            `/v2/options`,
            {
                headers: {
                    Authorization: `Token ${apiKey}`,
                },
            },
        );
        const { data } = await this.handleRequest(observable);
        return data;
    }

    async getTransactions(
        apiKey: string,
        wallet: number,
        page = 1,
    ) {
        const pageSize = 100;
        const observable = this.httpService.get<TransactionsResponse>(
            `/users/wallets/transactions/list`,
            {
                params: {
                    page,
                    pageSize,
                    wallet: wallet,
                },
                headers: {
                    Authorization: `Token ${apiKey}`,
                },
            },
        );

        const { data } = await this.handleRequest(observable);

        const transactions = [...data.transactions];

        if (data.transactions.length === pageSize) {
            const nextTransactions = await this.getTransactions(
                apiKey,
                wallet,
                page + 1,
            );

            transactions.push(
                ...nextTransactions,
            );
        }

        return transactions;
    }

    async getDeposits(
        apiKey: string,
        wallet: number,
        page = 1,
    ) {
        const observable = this.httpService.get<DepositResponse>(
            `/users/wallets/deposits/list`,
            {
                params: {
                    page,
                    pageSize: 100,
                    wallet: wallet,
                },
                headers: {
                    Authorization: `Token ${apiKey}`,
                },
            },
        );

        const { data } = await this.handleRequest(observable);

        const transactions = [...data.deposits];

        if (data.hasNext) {
            const nextTransactions = await this.getDeposits(
                apiKey,
                wallet,
                page + 1,
            );

            transactions.push(
                ...nextTransactions,
            );
        }

        return transactions;
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
