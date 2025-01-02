import { Database } from "@orca/types";

export type Portfolio = Database["public"]["Tables"]["portfolio"]["Row"];
export type PortfolioStatus =
    Database["public"]["Tables"]["portfolio"]["Row"][`status`];
export type CreatePortfolio =
    Database["public"]["Tables"]["portfolio"]["Insert"];
export type UpdatePortfolio =
    Database["public"]["Tables"]["portfolio"]["Insert"];

export type PortfolioStatusUpdate = {
    portfolioId: string;
    userId: string;
    status: PortfolioStatus;
};
