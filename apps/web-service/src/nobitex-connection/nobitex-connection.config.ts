import { registerAs } from "@nestjs/config";

export default registerAs("nobitex-connection", () => ({
  baseUrl: process.env.NOBITEX_BASE_URL,
}));
