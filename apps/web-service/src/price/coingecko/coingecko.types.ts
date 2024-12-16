type CryptoAsset = {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    [key: string]: string;
  };
};

export type CryptoAssetListResponse = CryptoAsset[];

export type PriceResponse = {
  [key: string]: {
    usd: number;
  };
};
