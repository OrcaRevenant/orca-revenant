export abstract class ConnectionAbstract {
    abstract getAssets(apiKey: string): Promise<Asset[]>;
}

export type Asset = {
    id: string;
    name: string;
    symbol: string;
};
