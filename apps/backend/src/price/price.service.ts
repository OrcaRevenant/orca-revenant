import dayjs from "dayjs";
import priceConfig from "./price.config";
import { PriceAbstract } from "./price.abstract";
import { ConfigType } from "@nestjs/config";
import { BackfillService } from "./backfill/backfill.service";
import { PriceRepository } from "./price.repository";
import { AssetRepository } from "@/asset/asset.repository";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class PriceService implements OnModuleInit {
    private readonly currentDate = dayjs();
    constructor(
        @Inject(priceConfig.KEY) private readonly config: ConfigType<
            typeof priceConfig
        >,
        @Inject("PriceProvider") private readonly priceProvider: PriceAbstract,
        private readonly backfillService: BackfillService,
        private readonly priceRepository: PriceRepository,
        private readonly assetRepository: AssetRepository,
    ) {
    }

    // @Cron("0/2 * * * *")
    // async scheduleCurrentUpdate() {
    //     await this.updateAssetsPrice();
    // }

    async onModuleInit() {
        console.log(`Cleaning db`);
        await this.priceRepository.clean();
        console.log(`Cleaned`);

        await this.performeBackfill();
        // await this.scheduleCurrentUpdate();
    }

    private async updateAssetsPrice() {
        const symbols = await this.getAssetSymbols();

        const currentUpdateDate = dayjs().startOf("minute").toDate();
        const currentPrices = await this.priceProvider.getCurrentAssetPrices(
            symbols,
        );

        const records = Object.keys(currentPrices).map((v) => ({
            asset: v,
            price: currentPrices[v],
            time: currentUpdateDate.toISOString(),
        }));

        await this.priceRepository.insertMany(records);
    }

    async performeBackfill() {
        // const symbols = await this.getAssetSymbols();

        const endTrackingDate = this.currentDate.subtract(2, "minutes").startOf(
            "minute",
        );

        const startTrackingFromDate = await this
            .determineStartTrackingDate(
                `btc`,
                this.currentDate,
            );

        await this.backfillService.addBackfillJob(
            `btc`,
            startTrackingFromDate.toDate(),
            endTrackingDate.toDate(),
            2,
        );

        // await Promise.all(
        //     symbols.map(async (symbol) => {
        //         const startTrackingFromDate = await this
        //             .determineStartTrackingDate(
        //                 symbol,
        //                 this.currentDate,
        //             );

        //         console.log(
        //             `Backfilling for ${symbol} from ${startTrackingFromDate.toISOString()} to ${endTrackingDate.toISOString()}`,
        //         );

        //         await this.backfillService.addBackfillJob(
        //             symbol,
        //             startTrackingFromDate.toDate(),
        //             endTrackingDate.toDate(),
        //             2,
        //         );
        //     }),
        // );
    }

    private async getAssetSymbols() {
        const assets = await this.assetRepository.findAll();
        return assets.map((v) => v.symbol);
    }

    private async determineStartTrackingDate(
        asset: string,
        currentTimestamp: dayjs.Dayjs,
    ): Promise<dayjs.Dayjs> {
        // const lastPriceTime = await this.priceRepository.getLastPriceTime(
        //     asset,
        // );

        return currentTimestamp.subtract(100, "year").startOf("minutes");

        // if (!lastPriceTime) {
        //     return currentTimestamp.subtract(1, "year").startOf("minutes");
        // }

        // const lastPriceDate = dayjs(lastPriceTime);
        // return lastPriceDate.isAfter(currentTimestamp)
        //     ? currentTimestamp
        //     : lastPriceDate;
    }
}
