import { Asset } from "@/asset/asset.types";
import { PopulatedPortfolio } from "@/portfolio/portfolio.types";

export type Transaction = {
  amount: number | null;
  asset: string;
  hash: string;
  id: string;
  portfolio_id: string;
  time: string;
  type: string;
  value: number | null;
};

export type PopulatedTransaction =
  & Omit<Transaction, `asset` | `portfolio_id`>
  & {
    asset: Pick<Asset, `name` | `symbol` | `logo`>;
    portfolio: Pick<PopulatedPortfolio, `title` | `connection` | `id`>;
    portfolio_total_value: number;
    pnl: number;
    pnl_percentage: number;
  };
