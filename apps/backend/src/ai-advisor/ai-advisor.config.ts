import { registerAs } from "@nestjs/config";

export default registerAs("ai-advisor", () => ({
  apiKey: process.env.OPENAI_API_KEY,
}));
