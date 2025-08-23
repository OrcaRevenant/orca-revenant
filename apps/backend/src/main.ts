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
