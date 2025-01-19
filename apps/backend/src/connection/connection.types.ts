import { DB } from "@orca/types";

export type PortfolioValue = {
    asset: string;
    balance: number;
};

export type Connection = {
    created_at: string;
    description: string | null;
    enabled: boolean;
    logo: string | null;
    name: string;
    title: string;
    type: string;
};
