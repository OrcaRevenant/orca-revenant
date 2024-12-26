import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./app.config";
// import { PriceModule } from "./price/price.module";
import { ScheduleModule } from "@nestjs/schedule";
import { PassportModule } from "@nestjs/passport";
import { AuthModule } from "./auth/auth.module";

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
    PassportModule,
    ScheduleModule.forRoot(),
    AuthModule,
    // PriceModule.forRoot(true),
    // ConnectionModule,
    // PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
