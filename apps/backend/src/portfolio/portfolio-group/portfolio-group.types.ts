import { PopulatedPortfolio } from "../portfolio.types";

export type PortfolioGroupUniqueIdentifier = (string & {}) | "root";

export interface PortfolioGroup {
  id: string;
  title: string;
  color: string;
  user_id: string;
  parent_id: string | null;
  created_at: Date;
}

export interface PortfolioGroupStats {
  total_value: number;
  unique_assets: Set<string>;
  total_portfolios: number;
}

export interface PortfolioGroupTreeItem {
  type: "portfolio" | "group";
}

export interface PortfolioTreeItem
  extends PopulatedPortfolio,
    PortfolioGroupTreeItem {
  type: "portfolio";
}

export interface GroupTreeItem
  extends PopulatedPortfolioGroup,
    PortfolioGroupTreeItem {
  type: "group";
}

export type PortfolioGroupTree = (PortfolioTreeItem | GroupTreeItem)[];

export interface PopulatedPortfolioGroup
  extends PortfolioGroup,
    PortfolioGroupStats {
  children?: PortfolioGroupTree;
}
