import { Database } from "@orca/types";

export type Portfolio = Database["public"]["Tables"]["portfolio"]["Row"];
export type PortfolioStatus =
    Database["public"]["Tables"]["portfolio"]["Row"][`status`];
export type CreatePortfolio =
    Database["public"]["Tables"]["portfolio"]["Insert"];
export type UpdatePortfolio =
    Database["public"]["Tables"]["portfolio"]["Insert"];

export type PortfolioAsset =
    Database["public"]["Tables"]["portfolio_assets"]["Row"];
export type CreatePortfolioAsset =
    Database["public"]["Tables"]["portfolio_assets"]["Insert"];

export type PortfolioStatusUpdate = {
    portfolioId: string;
    userId: string;
    status: PortfolioStatus;
};
