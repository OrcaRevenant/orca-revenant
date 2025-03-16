import { Connection } from "@/connection/connection.types";
import { PortfolioGroupUniqueIdentifier } from "./portfolio-group/portfolio-group.types";

export type PortfolioType = "portfolio" | "group";

export type PortfolioStatus = "active" | "inactive" | "syncing" | "unknown";

export interface Portfolio {
  meta?: Record<string, unknown>;
  color: string;
  connection_name: string;
  created_at: string;
  disabled: boolean;
  id: string;
  last_sync_at: string | null;
  status: PortfolioStatus;
  title: string;
  user_id: string;
  group_id: PortfolioGroupUniqueIdentifier | null;
}

export interface PopulatedPortfolio extends Omit<Portfolio, `connection_name`> {
  connection: Pick<Connection, `logo` | `name` | `title` | `type`>;
  value: number;
  asset_count: number;
  assets: string[];
}

export interface PortfolioStatusUpdate {
  portfolioId: string;
  userId: string;
  status: PortfolioStatus;
}

export type Timeframe = "daily" | "weekly" | "monthly" | "yearly";
