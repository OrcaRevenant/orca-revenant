import { registerAs } from "@nestjs/config";
import { PriceProviderConfig } from "../price-provider.abstract";

export default registerAs<PriceProviderConfig>("binance", () => ({
    includes: `*`,
    excludes: [`irt`, `usdt`, `xaut`],
    name: `binance`,
    priority: 1,
}));
