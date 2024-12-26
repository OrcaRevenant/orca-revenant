import { registerAs } from "@nestjs/config";

export default registerAs("coingecko", () => ({
  baseUrl: process.env.PRICE_SERVICE_BASE_URL,
  apiKey: process.env.PRICE_SERVICE_API_KEY,
}));
