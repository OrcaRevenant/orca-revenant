import { registerAs } from "@nestjs/config";

export default registerAs("tradingview", () => ({
  apiKey: ``,
  baseUrl: "https://api.tradingview.com/",
}));
