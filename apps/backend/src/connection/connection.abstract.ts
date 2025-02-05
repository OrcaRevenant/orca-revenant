export abstract class ConnectionAbstract {
    abstract getAssets(meta: Meta): Promise<Asset[]>;
    abstract checkHealth(meta: Meta): Promise<Health>;
    abstract getTransactions(
        meta: Meta,
    ): Promise<Transaction[]>;
}

export type Asset = {
    symbol: string;
    balance: number;
};

export type TransactionType = `buy` | `sell` | `withdrawal` | `deposit`;

export type UniqueIdentifier = string | number;

export type Health = `active` | `inactive`;

export type Transaction = {
    id: UniqueIdentifier;
    time: string;
    asset: string;
    type: TransactionType;
    amount: number;
};

export type Meta = Record<string, unknown>;
