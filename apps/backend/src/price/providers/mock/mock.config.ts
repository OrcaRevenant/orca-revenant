import { registerAs } from "@nestjs/config";
import { PriceProviderConfig } from "../price-provider.abstract";

export default registerAs<PriceProviderConfig>("mock", () => ({
    includes: `*`,
    name: `mock`,
    priority: 100,
}));
