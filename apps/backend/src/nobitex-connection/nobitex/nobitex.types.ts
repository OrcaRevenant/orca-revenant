export type Reseponse<T> = {
    status: string;
} & T;

export type PaginatedResponse<T> = Reseponse<{ hasNext: boolean } & T>;

export type NobitexMarketStatsResponse = Reseponse<{
    stats: {
        [symbol: string]: NobitexMarketStat;
    };
}>;

export interface NobitexMarketStat {
    bestBuyPrice: number;
    bestSellPrice: number;
    latest: number;
    dayHigh: number;
    dayLow: number;
    dayOpen: number;
    dayClose: number;
    dayVolume: number;
    dayChange: number;
}

export type NobitexOptionsResponse = Reseponse<{
    features: {
        fcmEnabled: boolean;
        chat: string;
        walletsToNet: boolean;
        autoKYC: boolean;
        enabledFeatures: string[];
        betaFeatures: string[];
    };
    coins: Array<{
        coin: string;
        name: string;
        defaultNetwork: string;
        displayPrecision: string;
        networkList: Record<string, {
            addressRegex: string;
            coin: string;
            depositEnable: boolean;
            isDefault: boolean;
            minConfirm: number;
            name: string;
            network: string;
            withdrawEnable: boolean;
            withdrawFee: string;
            withdrawIntegerMultiple: string;
            withdrawMax: string;
            withdrawMin: string;
        }>;
        stdName: string;
    }>;
    nobitex: {
        allCurrencies: string[];
        activeCurrencies: string[];
        xchangeCurrencies: string[];
        topCurrencies: string[];
        testingCurrencies: string[];
        withdrawLimits: Record<string, {
            dailyCoin: string;
            dailyRial: string;
            dailySummation: string;
            monthlySummation: string;
        }>;
        minOrders: Record<string, string>;
        amountPrecisions: Record<string, string>;
        pricePrecisions: Record<string, string>;
        giftCard: {
            physicalFee: string;
        };
    };
}>;

export type Transaction = {
    currency: string;
    created_at: string;
    calculatedFee: string;
    id: number;
    amount: string;
    description: string;
};

export type TransactionsResponse = PaginatedResponse<{
    transactions: Transaction[];
}>;

export type WalletsResponse = Reseponse<{
    wallets: {
        [currency: string]: {
            id: number;
            balance: string;
            blocked: string;
        };
    };
}>;

export type DepositResponse = PaginatedResponse<{
    deposits: {
        txHash: string;
        address: string;
        confirmed: boolean;
        transaction: Transaction;
        currency: string;
        blockchainUrl: string;
        confirmations: number;
        requiredConfirmations: number;
        amount: string;
    }[];
    hasNext: boolean;
}>;
