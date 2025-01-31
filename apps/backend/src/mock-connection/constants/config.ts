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
                        id: "1",
                        amount: 10,
                        asset: "usdt",
                        time: "2024-01-30T10:00:00Z",
                        type: "deposit",
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
                        id: "1",
                        amount: 20,
                        asset: "usdt",
                        time: "2024-01-10:00:00Z",
                        type: "deposit",
                    },
                ],
            },
        ],
    },
];
