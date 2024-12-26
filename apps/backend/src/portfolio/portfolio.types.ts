import { Database } from "@orca/types";

export type Portfolio = Database["public"]["Tables"]["portfolio"]["Row"];
export type CreatePortfolio =
    Database["public"]["Tables"]["portfolio"]["Insert"];
export type UpdatePortfolio =
    Database["public"]["Tables"]["portfolio"]["Insert"];
