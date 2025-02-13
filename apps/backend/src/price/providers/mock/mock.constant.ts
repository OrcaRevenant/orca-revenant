export const MOCK_ASSET_PRICES: {
    [asset: string]: {
        basePrice: number;
        fluctuationRange: number;
        precision: number;
    };
} = {
    btc: { basePrice: 100_000, fluctuationRange: 0.05, precision: 8 },
    eth: { basePrice: 4_000, fluctuationRange: 0.1, precision: 18 },
    usdt: { basePrice: 1, fluctuationRange: 0.01, precision: 4 },
    ton: { basePrice: 5, fluctuationRange: 0.01, precision: 4 },
    bnb: { basePrice: 4_000, fluctuationRange: 0.1, precision: 4 },
    rls: { basePrice: 0.00000125, fluctuationRange: 0, precision: 8 },
};
