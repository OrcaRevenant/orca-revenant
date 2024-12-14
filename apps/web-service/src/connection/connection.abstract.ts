export abstract class ConnectionAbstract {
    abstract getAssets(apiKey: string): Promise<Asset[]>;
    abstract getTransactions(apiKey: string): Promise<Transaction[]>;
    abstract checkHealth(apiKey: string): Promise<Health>;
}

export type Asset = {
    symbol: string;
};

export type TransactionType = `buy` | `sell` | `withdrawal` | `deposit`;

export type UniqueIdentifier = string | number;

export type Transaction = {
    time: string;
    amount: number;
    fee: number;
    asset: string;
    type: TransactionType;
    portfolio_id: UniqueIdentifier;
};

export type Health = `alive` | `dead`;
