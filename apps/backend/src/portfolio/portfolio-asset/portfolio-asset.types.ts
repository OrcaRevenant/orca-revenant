export type PortfolioAsset = {
  amount: number;
  asset: string;
  portfolio_id: string;
};

export type PopulatedPortfolioAsset = PortfolioAsset & {
  value: number;
  price_per_unit: number;
  pnl: number;
  pnl_percentage: number;
  change: number;
  change_percentage: number;
  price_at_calculation: number;
};
