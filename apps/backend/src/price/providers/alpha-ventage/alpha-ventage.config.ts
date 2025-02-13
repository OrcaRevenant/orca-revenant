// price.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("alpha-ventage", () => ({
  apiKey: `LBU4A7XTVKFLSFLW`,
  baseUrl: "https://www.alphavantage.co/query",
}));
