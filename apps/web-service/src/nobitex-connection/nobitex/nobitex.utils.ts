import { TransactionType } from "@/connection/connection.abstract";
import { TransactionsResponse } from "./nobitex.types";

export function getTransactionTypeFromDescription(
    tx: TransactionsResponse[`transactions`][number],
): TransactionType {
    const { description, amount } = tx;
    const numericAmount = +amount;

    const isMatch = (patterns: string[]) =>
        patterns.some((pattern) => new RegExp(pattern).test(description));

    let action: TransactionType;

    if (isMatch([`Withdraw`, `Internal transfer to`])) {
        action = `withdrawal`;
    } else if (isMatch([`واریز`, `Deposit`, `Internal transfer from`])) {
        action = `deposit`;
    } else if (isMatch([`خرید`])) {
        action = `buy`;
    } else {
        action = `sell`;
    }

    if (action === `sell` || action === `buy`) {
        if (numericAmount < 0) {
            return `sell`;
        } else {
            return `buy`;
        }
    }

    return action;
}
