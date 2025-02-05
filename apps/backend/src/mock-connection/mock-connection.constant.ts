import { Transaction } from "@/connection/connection.abstract";
import { Portfolio } from "@orca/types";

export type MockPortfolio =
    & Pick<
        Portfolio,
        `connection_name` | `title` | `api_key` | `group_id`
    >
    & { transactions: Transaction[]; color: string; disabled?: boolean };

export type MockAccount = {
    user: string;
    portfolios: MockPortfolio[];
};

export const MOCK_ACCOUNTS: MockAccount[] = [
    {
        user: `adam@orca.com`,
        portfolios: [
            {
                connection_name: "mock",
                title: "Adam Portfolio",
                color: "#a11043",
                api_key: "mock-api-key-1",
                disabled: false,
                group_id: null,
                transactions: [
                    {
                        id: "0",
                        amount: 1,
                        asset: "usdt",
                        time: "2024-02-04T00:00:00Z",
                        type: "deposit",
                    },
                    {
                        id: "1",
                        amount: 99,
                        asset: "usdt",
                        time: "2024-02-05T00:00:00Z",
                        type: "deposit",
                    },
                    {
                        id: "2",
                        amount: 1,
                        asset: "bnb",
                        time: "2024-02-22T00:00:00Z",
                        type: "deposit",
                    },
                    {
                        id: "3",
                        amount: 1,
                        asset: "bnb",
                        time: "2024-05-22T00:00:00Z",
                        type: "withdrawal",
                    },
                ],
            },
            {
                connection_name: "mock",
                title: "Adam Second Portfolio",
                color: "#a11043",
                api_key: "mock-api-key-2",
                disabled: false,
                group_id: null,
                transactions: [
                    {
                        id: "00",
                        amount: 1,
                        asset: "bnb",
                        time: "2024-01-01T00:00:00Z",
                        type: "deposit",
                    },
                ],
            },
        ],
    },
];
