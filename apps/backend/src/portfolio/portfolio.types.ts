export type PortfolioStatus = "active" | "inactive" | "syncing" | "unknown";

export type Portfolio = {
    api_key: string;
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

export type PortfolioAsset = {
    amount: number;
    asset: string;
    portfolio_id: string;
};

export type PortfolioStatusUpdate = {
    portfolioId: string;
    userId: string;
    status: PortfolioStatus;
};
