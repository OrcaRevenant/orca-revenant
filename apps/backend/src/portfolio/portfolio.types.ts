import { Connection } from "@/connection/connection.types";

export type PortfolioType = "portfolio" | "group";

export type PortfolioStatus = "active" | "inactive" | "syncing" | "unknown";

export type Portfolio = {
    meta: Record<string, unknown>;
    color: string;
    connection_name: string;
    created_at: string;
    disabled: boolean;
    id: string;
    last_sync_at: string | null;
    status: PortfolioStatus;
    title: string;
    user_id: string;
};

export type PopulatedPortfolio = Omit<Portfolio, `connection_name`> & {
    connection: Pick<Connection, `logo` | `name` | `title` | `type`>;
};

export type PortfolioStatusUpdate = {
    portfolioId: string;
    userId: string;
    status: PortfolioStatus;
};

export type PortfolioTreeItem = {
    id: number;
    title: string;
    color: string;
    type: "group" | "portfolio";
    parent_id: number | null;
    connection_name?: string;
    status?: string;
    disabled?: boolean;
    children?: PortfolioTreeItem[];
};
