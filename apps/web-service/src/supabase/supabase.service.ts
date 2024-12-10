import { Injectable, OnModuleInit } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService implements OnModuleInit {
    private readonly supabase: SupabaseClient;

    constructor() {
        const SUPABASE_URL = "http://127.0.0.1:54321";
        const SUPABASE__SERVICE_ROLE_KEY =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
        this.supabase = createClient(SUPABASE_URL, SUPABASE__SERVICE_ROLE_KEY);
    }

    onModuleInit() {
        this.listenToPortfolioInserts();
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
    handleInserts(payload: any) {
        console.log("Change received!", payload);
    }

    private listenToPortfolioInserts() {
        console.log(`listening to changes in portfolio`);
        this.supabase
            .channel("portfolio")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "portfolio",
            }, this.handleInserts)
            .subscribe();
    }
}
