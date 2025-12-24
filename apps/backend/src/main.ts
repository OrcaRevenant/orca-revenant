import { ValidationPipe } from "@nestjs/common";
import { ConfigService, ConfigType } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import appConfig from "./app.config";
import { AppModule } from "./app.module";
import { ExceptionHandlerService } from "./common/exception/exception-handler.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<ConfigType<typeof appConfig>>);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || true, // Allow all origins in dev, specific URL in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  app.useGlobalFilters(app.get(ExceptionHandlerService));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Set up Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Orca API")
    .setDescription("API documentation for Orca")
    .setVersion("1.0")
    .addTag("ai-advisor", "AI Financial Advisor")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = config.get(`port`, { infer: true })!;

  await app.listen(port || 3000);
}

bootstrap();
