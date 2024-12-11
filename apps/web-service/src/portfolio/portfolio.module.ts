import { Module } from "@nestjs/common";
import { PortfolioService } from "./portfolio.service";
import { SupabaseModule } from "src/supabase/supabase.module";
import { ConnectionModule } from "src/connection/connection.module";

@Module({
  imports: [SupabaseModule, ConnectionModule],
  providers: [PortfolioService],
})
export class PortfolioModule {}
