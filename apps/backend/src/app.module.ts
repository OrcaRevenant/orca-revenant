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
import { FeedbackModule } from "./feedback/feedback.module";
import { TransactionModule } from "./transaction/transaction.module";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullModule } from "@nestjs/bullmq";

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
    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: 6379,
      },
    }),
    BullBoardModule.forRoot({
      route: "/queues",
      adapter: ExpressAdapter,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    ConnectionModule,
    FeedbackModule,
    TransactionModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  }],
})
export class AppModule {}
