import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService, ConfigType } from "@nestjs/config";
import appConfig from "./app.config";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<ConfigType<typeof appConfig>>);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = config.get(`port`, { infer: true })!;

  await app.listen(port || 3000);
}
bootstrap();
