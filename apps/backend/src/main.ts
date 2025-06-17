import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService, ConfigType } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import * as fs from "fs";
import { SpelunkerModule } from "nestjs-spelunker";
import appConfig from "./app.config";
import { AppModule } from "./app.module";
import { ExceptionHandlerService } from "./common/exception/exception-handler.service";

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
        !edge.includes("FilteredModule") && !edge.includes("OtherExample")
    )
    .sort();
  // write into file
  fs.writeFileSync(
    "deps.mermaid",
    `graph LR
${mermaidEdges.join("\n")}`
  );
}
