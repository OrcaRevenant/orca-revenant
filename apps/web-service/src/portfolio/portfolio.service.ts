import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConnectionService } from "@/connection/connection.service";
import { SupabaseService } from "@/supabase/supabase.service";
import { Database } from "@orca/types";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

@Injectable()
export class PortfolioService implements OnModuleInit {
    private readonly syncThresholdMinutes = 5;
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly connection: ConnectionService,
    ) {
        this.handleInserts = this.handleInserts.bind(this);
    }

    onModuleInit() {
        this.listenToPortfolioInserts();
        this.syncInitialPortfolios(this.syncThresholdMinutes);
    }

    private async syncInitialPortfolios(syncThresholdMinutes: number = 5) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from("portfolio")
            .select("*");

        if (!error && data) {
            let syncedCount = 0;
            let skippedCount = 0;

            const syncThreshold = new Date(
                Date.now() - syncThresholdMinutes * 60 * 1000,
            );

            await Promise.all(
                data.map(async (portfolio) => {
                    const lastSyncAt = portfolio.last_sync_at
                        ? new Date(portfolio.last_sync_at)
                        : null;

                    if (!lastSyncAt || lastSyncAt < syncThreshold) {
                        try {
                            await this.syncPortfolio(portfolio);

                            syncedCount++;
                            return { portfolio, synced: true };
                        } catch (error) {
                            console.error(
                                `Error processing portfolio ${portfolio.id}:`,
                                error,
                            );
                            return { portfolio, error };
                        }
                    } else {
                        skippedCount++;
                        return { portfolio, skipped: true };
                    }
                }),
            );

            console.log(
                `Processed portfolios: Synced ${syncedCount}, Skipped ${skippedCount}`,
            );
        } else {
            console.error("Error fetching portfolios:", error);
        }
    }

    private listenToPortfolioInserts() {
        console.log("Listening to changes in portfolio");
        this.supabaseService
            .getClient()
            .channel("portfolio")
            .on<Database["public"]["Tables"]["portfolio"]["Row"]>(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "portfolio",
                },
                async (payload) => await this.handleInserts(payload),
            )
            .subscribe();
    }

    private async handleInserts(
        payload: RealtimePostgresInsertPayload<
            Database["public"]["Tables"]["portfolio"]["Row"]
        >,
    ) {
        console.log("Portfolio change received!", payload);
        await this.syncPortfolio(payload.new);
    }

    private async syncPortfolio(
        portfolio: Database["public"]["Tables"]["portfolio"]["Row"],
    ) {
        try {
            await this.connection.syncTransactions(portfolio);
            await this.connection.syncPortfolioAssets(
                portfolio,
            );
        } catch {
            console.log(`Failed trying to sync portfolio (id=${portfolio.id})`);
        }
    }
}
