import { registerAs } from "@nestjs/config";

export default registerAs("price", () => ({
  interval: 1, // in minutes
}));
