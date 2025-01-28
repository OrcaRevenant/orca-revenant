import dayjs from "dayjs";
import priceConfig from "./price.config";
import { PriceAbstract } from "./price.abstract";
import { ConfigType } from "@nestjs/config";
import { BackfillService } from "./backfill/backfill.service";
import { PriceRepository } from "./price.repository";
import { AssetRepository } from "@/asset/asset.repository";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";

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
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {}

    async onModuleInit() {
        console.log(`Draining queue...`);
        try {
            await this.backfillService.queue.pause();
            await this.backfillService.queue.drain();
            await this.backfillService.queue.obliterate({ force: true });
            console.log(`Queue drained successfully!`);
            await this.performeBackfill();
        } catch (error) {
            console.error("Error during onModuleInit:", error);
        }
    }

    private addUpdatePriceCronJob() {
        const job = new CronJob(`*/2 * * * *`, async () => {
            try {
                await this.updateAssetsPrice();
            } catch (error) {
                console.error("Error in dynamically added cron job:", error);
            }
        });

        this.schedulerRegistry.addCronJob("updateAssetsPrice", job);
    }

    private async updateAssetsPrice() {
        try {
            const symbols = await this.getAssetSymbols();
            const currentUpdateDate = dayjs().startOf("minute").toDate();
            const currentPrices = await this.priceProvider
                .getCurrentAssetPrices(symbols);

            const records = Object.keys(currentPrices).map((symbol) => ({
                asset: symbol,
                price: currentPrices[symbol],
                time: currentUpdateDate.toISOString(),
            }));

            await this.priceRepository.insertInChunks(records);
        } catch (error) {
            console.error("Error in updateAssetsPrice:", error);
        }
    }

    async performeBackfill() {
        const symbols = await this.getAssetSymbols();

        const endTrackingDate = this.currentDate.startOf(
            "minute",
        );

        await Promise.all(
            symbols.map(async (symbol) => {
                const startTrackingFromDate = await this
                    .determineStartTrackingDate(symbol);

                // Check for gaps between start and end tracking dates
                const gapMinutes = endTrackingDate.diff(
                    startTrackingFromDate,
                    "minutes",
                );

                if (gapMinutes <= 2) {
                    console.log(
                        `No backfill needed for ${symbol}. Gap: ${gapMinutes} minutes.`,
                    );
                    return; // Skip backfill if no gap or gap is too small
                }

                console.log(
                    `Adding backfill job for ${symbol}: ${startTrackingFromDate} to ${endTrackingDate}`,
                );

                await this.backfillService.addBackfillJob(
                    symbol,
                    startTrackingFromDate.add(2, `minutes`).toDate(),
                    endTrackingDate.toDate(),
                    2,
                );
            }),
        );
    }
    private async getAssetSymbols(): Promise<string[]> {
        const assets = await this.assetRepository.findAll();
        return assets.map((asset) => asset.symbol);
    }

    private async determineStartTrackingDate(
        asset: string,
    ): Promise<dayjs.Dayjs> {
        const lastPriceTime = await this.priceRepository.findLatestTimestamp(
            asset,
        );
        if (!lastPriceTime) {
            return this.currentDate.subtract(4, "year").startOf("minute");
        }

        const lastPriceDate = dayjs(lastPriceTime);
        return lastPriceDate.isAfter(this.currentDate)
            ? this.currentDate
            : lastPriceDate;
    }
}
