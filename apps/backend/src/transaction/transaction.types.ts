import { Database } from "@orca/types";

export type Transaction = Database["public"]["Tables"]["transaction"]["Row"];
export type CreateTransaction =
  Database["public"]["Tables"]["transaction"]["Insert"];
