export type Response<T> = {
    code: number;
    message: string;
    data: T;
};

export type GetSportBalanceResponse = Response<{
    "ccy": string;
    "available": string;
    "frozen": string;
}[]>;

export type GetAccountInfo = Response<{
    user_id: string;
}>;

export type GetSpotTransactions = {
    query: GetSpotTransactionsQuery;
};

export type TransactionType = "deposit" | "withdraw" | "trade";
export type Transaction = {
    "balance": string;
    "ccy": string;
    "change": string;
    "created_at": number;
    "type": TransactionType;
};

export type GetSpotTransactionsQuery = {
    page: number;
    limit: number;
    type: TransactionType;
};

export type GetSpotTransactionsResponse = Response<Transaction[]>;
