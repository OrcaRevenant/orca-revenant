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

export type PopulatedTransaction = {
  amount: number | null;
  asset: Pick<Asset, `name` | `symbol` | `logo`>;
  hash: string;
  id: string;
  portfolio: Pick<PopulatedPortfolio, `title` | `connection` | `id`>;
  time: string;
  type: string;
  value: number | null;
  portfolio_total_value: number;
};
