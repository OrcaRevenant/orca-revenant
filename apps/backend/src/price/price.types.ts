import { Database } from "@orca/types";

export type Price = Database[`public`][`Tables`][`price`][`Row`];
export type CreatePrice = Database[`public`][`Tables`][`price`][`Insert`];
export type UpdatePrice = Database[`public`][`Tables`][`price`][`Update`];
