import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService, ConfigType } from "@nestjs/config";
import appConfig from "./app.config";
import { ValidationPipe } from "@nestjs/common";
import { ExceptionHandlerService } from "./common/exception/exception-handler.service";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<ConfigType<typeof appConfig>>);

  app.enableCors({
    origin: [
      "http://localhost:3000", // Your main frontend
      "http://localhost:3001", // Other internal apps
      "http://localhost:5173", // Vite dev server
      process.env.FRONTEND_URL, // Production frontend URL
      // Add your internal service URLs here
      ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
    ].filter(Boolean),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Last-Event-Id",
      "X-Service-Token", // Allow service token header
      "X-User-Token", // Allow user token header for services
    ],
    credentials: true,
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
