import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import dayjs, { Dayjs } from "dayjs";
import assetDetailsConfig from "./asset-details.config";

@Injectable()
export class AssetDetailsService {
    constructor(
        @Inject(assetDetailsConfig.KEY) private readonly config: ConfigType<
            typeof assetDetailsConfig
        >,
        private readonly httpService: HttpService,
    ) {}

    async getAssetListingDate(symbol: string): Promise<Dayjs | null> {
        try {
            const coinId = symbol.toLowerCase();

            const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
            const response = await firstValueFrom(this.httpService.get(url));

            const listingDate = response.data?.genesis_date;
            if (!listingDate) return null;

            return dayjs(listingDate);
        } catch (error) {
            console.error(
                `Error fetching listing date for ${symbol}:`,
                error.message,
            );
            return null;
        }
    }
}
