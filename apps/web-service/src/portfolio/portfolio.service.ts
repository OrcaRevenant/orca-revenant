import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConnectionService } from "src/connection/connection.service";
import { SupabaseService } from "src/supabase/supabase.service";

@Injectable()
export class PortfolioService implements OnModuleInit {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly connection: ConnectionService,
    ) {
        this.handleInserts = this.handleInserts.bind(this);
    }

    onModuleInit() {
        this.listenToPortfolioInserts();
    }

    private listenToPortfolioInserts() {
        console.log(`Listening to changes in portfolio`);
        const supabase = this.supabaseService.getClient();
        supabase
            .channel("portfolio")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "portfolio",
                },
                this.handleInserts,
            )
            .subscribe();
    }

    private handleInserts(payload: any) {
        console.log("Portfolio change received!", payload);
        this.connection.syncTransactions(payload.new);
    }
}
