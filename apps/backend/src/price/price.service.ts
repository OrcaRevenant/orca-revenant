import dayjs, { Dayjs } from "dayjs";
import priceConfig from "./price.config";
import { PriceAbstract, Resolution } from "./price.abstract";
import { ConfigType } from "@nestjs/config";
import { BackfillService } from "./backfill/backfill.service";
import { PriceRepository } from "./price.repository";
import { AssetRepository } from "@/asset/asset.repository";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { Price } from "./price.types";
import { CronJob } from "cron";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class PriceService implements OnModuleInit {
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
      await this.performBackfill();
    } catch (error) {
      console.error("Error during onModuleInit:", error);
    }
  }

  @OnEvent("backfill.completed")
  async onPriceBackfillCompleted() {
    const job = new CronJob(this.config.updateCron, async () => {
      await this.performBackfill();
    });

    this.schedulerRegistry.addCronJob("updateAssetsPrice", job);
    job.start();
  }

  async performBackfill() {
    const currentDate = dayjs();

    const symbols = await this.getAssetSymbols();
    const endTrackingDate = currentDate.startOf("minute");
    const stepMinutes = this.config.backfillStep;

    await Promise.all(
      symbols.map(async (symbol) => {
        const startTrackingFromDate = await this
          .determineStartTrackingDate(symbol, currentDate);

        const gapSeconds = currentDate.diff(
          startTrackingFromDate,
          "seconds",
        );

        if (gapSeconds <= stepMinutes * 60) {
          console.log(
            `No backfill needed for ${symbol}. Gap: ${
              gapSeconds / 60
            } minutes.`,
          );
          return; // Skip backfill if no gap or gap is too small
        }

        console.log(
          `Adding backfill job for ${symbol}: ${startTrackingFromDate.toISOString()} to ${endTrackingDate.toISOString()}`,
        );

        await this.backfillService.addBackfillJob(
          symbol,
          startTrackingFromDate.add(stepMinutes, "minutes").toDate(),
          endTrackingDate.toDate(),
          stepMinutes,
        );
      }),
    );
  }

  async getAssetHistoricalPrice(
    asset: string,
    from: Date,
    to: Date,
    resolution: Resolution,
  ) {
    return this.priceProvider.getAssetHistoricalPrice(
      asset,
      from,
      to,
      resolution,
    );
  }

  async bulkInsert(prices: Price[]) {
    return this.priceRepository.bulkInsertUsingCopy(prices);
  }

  private async getAssetSymbols(): Promise<string[]> {
    const assets = await this.assetRepository.findAll();
    return assets.map((asset) => asset.symbol);
  }

  private async determineStartTrackingDate(
    asset: string,
    currentDate: Dayjs,
  ): Promise<dayjs.Dayjs> {
    const lastPriceTime = await this.priceRepository.findLatestTimestamp(
      asset,
    );
    if (!lastPriceTime) {
      return currentDate.subtract(
        this.config.initialLookbackYears,
        "year",
      ).startOf("minute");
    }

    const lastPriceDate = dayjs(lastPriceTime);
    return lastPriceDate.isAfter(currentDate) ? currentDate : lastPriceDate;
  }
}
