import * as crypto from "crypto";
import { Transaction } from "./connection.abstract";

export function generateTransactionHash(transaction: Transaction) {
    const { portfolio_id, asset, amount, fee, time, type } = transaction;
    const data = `${portfolio_id}|${asset}|${amount}|${fee}|${time}|${type}`;
    return crypto.createHash("sha256").update(data).digest("hex");
}
