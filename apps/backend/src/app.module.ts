import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./app.config";
import { ScheduleModule } from "@nestjs/schedule";
import { PassportModule } from "@nestjs/passport";
import { AuthModule } from "./auth/auth.module";
import { ConnectionModule } from "./connection/connection.module";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ResponseInterceptor } from "./shared/interceptors/response.interceptor";
import { ExceptionModule } from "./common/exception/exception.module";
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
    ExceptionModule,
    PassportModule,
    ScheduleModule.forRoot(),
    AuthModule,
    ConnectionModule,
    PortfolioModule,
    // PriceModule.forRoot(true),
    // ConnectionModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  }],
})
export class AppModule {}
