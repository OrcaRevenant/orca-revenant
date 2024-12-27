import { Database } from "@orca/types";

export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
export type CreateFeedback = Database["public"]["Tables"]["feedback"]["Insert"];
