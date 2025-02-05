export type Response<T> = {
    status: string;
} & T;

export type PaginatedResponse<T> = Response<{ hasNext: boolean } & T>;

export type NobitexMarketStatsResponse = Response<{
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

type Status = "all" | "open" | "done" | "close";

export type NobitexOptionsResponse = Response<{
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

export type WalletsResponse = Response<{
    wallets: {
        [currency: string]: {
            id: number;
            balance: string;
            blocked: string;
        };
    };
}>;

export type Deposit = {
    txHash: string;
    address: string;
    confirmed: boolean;
    transaction: Transaction;
    currency: string;
    blockchainUrl: string;
    confirmations: number;
    requiredConfirmations: number;
    amount: string;
};

export type DepositResponse = PaginatedResponse<{
    deposits: Deposit[];
}>;

export type Order = {
    id: number;
    type: "sell" | "buy";
    execution: "limit" | "market" | "stop_limit" | "stop_market";
    status: Status;
    srcCurrency: string;
    dstCurrency: string;
    price: string;
    amount: string;
    matchedAmount: string;
    averagePrice: string;
    fee: string;
    clientOrderId: string;
    totalPrice: string;
    totalOrderPrice: string;
    unmatchedAmount: string;
    partial: boolean;
    created_at: string;
    market: string;
};

export type OrdersResponse = PaginatedResponse<{
    orders: Order[];
}>;

export interface Withdrawal {
    id: number;
    createdAt: string;
    status: Status;
    amount: string;
    currency: string;
    address: string;
    tag: string | null;
    wallet_id: number;
    blockchain_url: string;
    is_cancelable: boolean;
    network: string;
    invoice: string | null;
}

export type WithdrawalsResponse = PaginatedResponse<{
    withdraws: Withdrawal[];
}>;

export type WithdrawResponse = PaginatedResponse<{
    withdraws: Withdrawal[];
}>;
