import { ExpressAdapter } from "@bull-board/express";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PassportModule } from "@nestjs/passport";
import { ScheduleModule } from "@nestjs/schedule";
import { AgentModule } from "./agent/agent.module";
import { AggregationModule } from "./aggregation/aggregation.module";
import appConfig from "./app.config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AssetModule } from "./asset/asset.module";
import { AuthModule } from "./auth/auth.module";
import { ExceptionModule } from "./common/exception/exception.module";
import { ConnectionModule } from "./connection/connection.module";
import { DatabaseModule } from "./database/database.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { PriceModule } from "./price/price.module";
import { ResponseInterceptor } from "./shared/interceptors/response.interceptor";

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
    EventEmitterModule.forRoot({
      global: true,
    }),
    ExceptionModule,
    PassportModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        username: "default",
        password: process.env.REDIS_PASSWORD || "",
        lazyConnect: true,
      },
    }),
    BullBoardModule.forRoot({
      route: "/",
      adapter: ExpressAdapter,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    DatabaseModule,
    AssetModule,
    PriceModule,
    FeedbackModule,
    ConnectionModule,
    PortfolioModule,
    AggregationModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
