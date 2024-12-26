import { Module } from "@nestjs/common";
import { PortfolioService } from "./portfolio.service";
import { SupabaseModule } from "@/common/supabase/supabase.module";
import { ConnectionModule } from "@/connection/connection.module";

@Module({
  imports: [SupabaseModule, ConnectionModule],
  providers: [PortfolioService],
})
export class PortfolioModule {}
