import { registerAs } from "@nestjs/config";

export default registerAs("binance", () => ({
    maxWorkers: 5,
    maxRetries: 3,
    baseUrl: "https://api.binance.com",
    klinesLimit: 1000,
    simulate429Errors: false,
}));
