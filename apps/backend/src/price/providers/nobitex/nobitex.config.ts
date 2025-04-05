import { registerAs } from "@nestjs/config";
import { PriceProviderConfig } from "../price-provider.abstract";

export interface NobitexSymbolMapping {
  flip: boolean;
  symbol?: string;
}

export interface NobitexConfig extends PriceProviderConfig {
  symbolMappings?: Record<string, NobitexSymbolMapping>;
}

export default registerAs<NobitexConfig>("nobitex", () => ({
  name: `nobitex`,
  priority: 2,
  includes: [`irt`],
  symbolMappings: {
    IRTUSDT: { flip: true, symbol: "USDTIRT" },
  },
}));
