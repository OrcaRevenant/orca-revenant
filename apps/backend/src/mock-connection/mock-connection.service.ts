// mock-connection.service.ts
import { Injectable } from "@nestjs/common";
import {
    Asset,
    ConnectionAbstract,
    Health,
    Transaction,
} from "@/connection/connection.abstract";
import { MOCK_ACCOUNTS } from "./constants/config";

@Injectable()
export class MockConnectionService implements ConnectionAbstract {
    constructor() {}

    private findPortfolioByApiKey(apiKey: string) {
        for (const account of MOCK_ACCOUNTS) {
            const portfolio = account.portfolios.find((p) =>
                p.api_key === apiKey && !p.disabled
            );
            if (portfolio) {
                return portfolio;
            }
        }
        return null;
    }

    async checkHealth(): Promise<Health> {
        // Simulate occasional health check failures
        const isHealthy = Math.random() > 0.1; // 10% chance of failure
        return isHealthy ? "active" : "inactive";
    }

    async getTransactions(apiKey: string): Promise<Transaction[]> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        const portfolio = this.findPortfolioByApiKey(apiKey);
        if (!portfolio) {
            throw new Error("Invalid API key");
        }

        return [...portfolio.transactions].sort((a, b) =>
            new Date(a.time).getTime() - new Date(b.time).getTime()
        );
    }

    async getAssets(apiKey: string): Promise<Asset[]> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        const portfolio = this.findPortfolioByApiKey(apiKey);
        if (!portfolio) {
            throw new Error("Invalid API key");
        }

        const balances = new Map<string, number>();

        // Process all transactions to calculate current balances
        portfolio.transactions.forEach((transaction) => {
            const currentBalance = balances.get(transaction.asset) || 0;
            const amount = transaction.type === "deposit"
                ? currentBalance + transaction.amount
                : currentBalance - transaction.amount;
            balances.set(transaction.asset, amount);
        });

        // Convert balances map to Asset array
        return Array.from(balances.entries()).map(([symbol, balance]) => ({
            symbol: symbol.toLowerCase(),
            balance: Math.max(0, balance), // Ensure balance is never negative
        }));
    }
}
