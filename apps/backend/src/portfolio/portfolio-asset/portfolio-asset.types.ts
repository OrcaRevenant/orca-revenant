export type PortfolioAsset = {
    amount: number;
    asset: string;
    portfolio_id: string;
};

export type PopulatedPortfolioAsset = PortfolioAsset & {
    value: number;
    price_per_unit: number;
};
