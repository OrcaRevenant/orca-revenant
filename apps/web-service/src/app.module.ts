import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConnectionModule } from "./connection/connection.module";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./app.config";
import { SupabaseModule } from "./supabase/supabase.module";
import { PortfolioModule } from "./portfolio/portfolio.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
      envFilePath: {
        test: [`.env.test.local`, `.env.test`, `.env`],
        development: [`.env.development.local`, `.env.development`, `.env`],
      }[process.env.NODE_ENV || `development`],
    }),
    SupabaseModule,
    ConnectionModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
