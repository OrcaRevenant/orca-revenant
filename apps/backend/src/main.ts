import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService, ConfigType } from "@nestjs/config";
import appConfig from "./app.config";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ExceptionHandlerService } from "./common/exception/exception-handler.service";
import { SpelunkerModule } from "nestjs-spelunker";
import * as fs from "fs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<ConfigType<typeof appConfig>>);

  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization, Last-Event-Id",
    credentials: true,
  });

  app.useGlobalFilters(app.get(ExceptionHandlerService));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = config.get(`port`, { infer: true })!;

  void generateDependencyGraph(app);

  await app.listen(port || 3000);
}

bootstrap();

async function generateDependencyGraph(app: INestApplication) {
  // Module dependencies graph
  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);
  const mermaidEdges = edges
    .map(({ from, to }) => `  ${from.module.name}-->${to.module.name}`)
    // filter out modules from the chart if you need
    .filter(
      (edge) =>
        !edge.includes("FilteredModule") && !edge.includes("OtherExample"),
    )
    .sort();
  // write into file
  fs.writeFileSync(
    "deps.mermaid",
    `graph LR
${mermaidEdges.join("\n")}`,
  );
}
