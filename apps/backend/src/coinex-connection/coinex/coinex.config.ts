import { registerAs } from "@nestjs/config";

export default registerAs("coinex", () => ({
  baseUrl: `https://api.coinex.com`,
}));
