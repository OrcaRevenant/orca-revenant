import { createHash } from "crypto";
import { Transaction } from "./coinex.types";
import { TransactionType } from "@/connection/connection.abstract";

export function createUniqueId(trx: Transaction): string {
    const stringToHash =
        `${trx.created_at}-${trx.ccy}-${trx.balance}-${trx.change}-${trx.type}`;

    return createHash("sha256").update(stringToHash).digest("hex");
}

export function digestType(trx: Transaction): TransactionType {
    if (trx.type === `trade`) {
        return Number(trx.change) > 0 ? "buy" : "sell";
    }
    if (trx.type === `withdraw`) return `withdrawal`;
    return `deposit`;
}
