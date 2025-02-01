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
                        id: "696b23dc-cfc9-4b41-b86e-5195386e7f3f",
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
                        id: "9bd4fea2-3963-41ff-ab47-ede6b6bce2a3",
                        amount: 20,
                        asset: "usdt",
                        time: "2024-01-10T10:00:00Z",
                        type: "deposit",
                    },
                    {
                        id: "9bd4fea2-3963-41ff-ab47-ede6b6basdads",
                        amount: 1,
                        asset: "btc",
                        time: "2025-01-01T10:00:00Z",
                        type: "deposit",
                    },
                    {
                        id: "9bd4fea2-3963-41ff-ab47-ede6b6basdads",
                        amount: 1,
                        asset: "btc",
                        time: "2025-01-20T10:00:00Z",
                        type: "withdrawal",
                    },
                ],
            },
        ],
    },
];
