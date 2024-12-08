import { registerAs } from "@nestjs/config";

export default registerAs("nobitex", () => ({
  baseUrl: process.env.NOBITEX_BASE_URL,
}));
