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
    id: UniqueIdentifier;
    time: string;
    amount: number;
    fee: number;
    asset: string;
    type: TransactionType;
};

export type Health = `alive` | `dead`;
