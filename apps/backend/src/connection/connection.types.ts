import { Database } from "@orca/types";

export type PortfolioValue = {
    asset: string;
    balance: number;
};

export type Connection = Database["public"]["Tables"]["connection"]["Row"];
