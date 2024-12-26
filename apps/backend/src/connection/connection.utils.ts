import * as crypto from "crypto";
import { UniqueIdentifier } from "./connection.abstract";

export function generateTransactionHash(transactionId: UniqueIdentifier) {
    const data = `${transactionId}`;
    return crypto.createHash("sha256").update(data).digest("hex");
}
