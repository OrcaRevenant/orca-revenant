export interface NobitexMarketStatsResponse {
    status: string;
    stats: {
        [symbol: string]: NobitexMarketStat;
    };
}

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
