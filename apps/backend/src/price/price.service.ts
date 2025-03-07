import dayjs, { Dayjs } from "dayjs";
import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { OnEvent } from "@nestjs/event-emitter";
import { CronJob } from "cron";

import priceConfig from "./price.config";
import { HistoricalPrice, PriceAbstract, Resolution } from "./price.abstract";
import { BackfillService } from "./backfill/backfill.service";
import { PriceRepository } from "./price.repository";
import { AssetRepository } from "@/asset/asset.repository";
import { Price } from "./price.types";
import { PriceProviderRegistry } from "./providers/price-provider.registry";

@Injectable()
export class PriceService extends PriceAbstract implements OnModuleInit {
  constructor(
    @Inject(priceConfig.KEY)
    private readonly config: ConfigType<typeof priceConfig>,
    private readonly backfillService: BackfillService,
    private readonly priceRepository: PriceRepository,
    private readonly assetRepository: AssetRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly priceProviderRegistry: PriceProviderRegistry
  ) {
    super();
  }

  async onModuleInit() {
    await this.priceProviderRegistry.init();

    console.log(`Draining queue...`);
    try {
      console.log("Attempting to pause queue...");
      await this.backfillService.queue.pause();

      console.log("Attempting to drain queue...");
      await this.backfillService.queue.drain();

      console.log("Attempting to obliterate queue...");
      await this.backfillService.queue.obliterate({ force: true });

      console.log(`Queue drained successfully!`);
      // await this.performBackfill();
    } catch (error) {
      console.error("Error during onModuleInit:", error.message);
      console.error("Error stack:", error.stack);
    }
  }

  // @OnEvent("backfill.completed")
  // async onPriceBackfillCompleted() {
  //   await this.performBackfill();

  //   const job = new CronJob(this.config.updateCron, async () => {
  //     await this.performBackfill();
  //   });

  //   this.schedulerRegistry.addCronJob("updateAssetsPrice", job);
  //   job.start();
  // }

  async performBackfill() {
    const currentDate = dayjs();

    const symbols = await this.getAssetSymbols();

    const endTrackingDate = currentDate.startOf("minute");

    const stepMinutes = this.config.backfillStep;

    await Promise.all(
      symbols.map(async (symbol) => {
        const startTrackingFromDate = await this.determineStartTrackingDate(
          symbol,
          currentDate
        );

        const gapSeconds = currentDate.diff(startTrackingFromDate, "seconds");

        if (gapSeconds <= stepMinutes * 60) {
          //
          console.log(
            `No backfill needed for ${symbol}. Gap: ${Math.round(gapSeconds / 60)} minutes.`
          );
          return; // Skip backfill if no gap or gap is too small
        }

        console.log(
          `Adding backfill job for ${symbol}: ${startTrackingFromDate.toISOString()} to ${endTrackingDate.toISOString()}`
        );

        await this.backfillService.addBackfillJob(
          symbol,
          startTrackingFromDate.clone().add(stepMinutes, "minutes").toDate(),
          endTrackingDate.toDate(),
          stepMinutes
        );
      })
    );
  }

  async getAssetHistoricalPrice(
    asset: string,
    from: Date,
    to: Date,
    resolution: Resolution
  ): Promise<HistoricalPrice[]> {
    const provider = this.priceProviderRegistry.getProvider(asset);

    if (!provider) {
      throw new NotFoundException(
        `No price provider found that supports asset: ${asset}`
      );
    }

    console.log(`Using provider '${provider.getName()}' for asset '${asset}'`);

    return provider.getHistoricalPrice(asset, from, to, resolution);
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
    currentDate: Dayjs
  ): Promise<dayjs.Dayjs> {
    const lastPriceTime = await this.priceRepository.findLatestTimestamp(asset);
    if (!lastPriceTime) {
      return currentDate
        .subtract(this.config.initialLookbackYears, "years")
        .startOf("minute");
    }

    const lastPriceDate = dayjs(lastPriceTime);
    return lastPriceDate.isAfter(currentDate) ? currentDate : lastPriceDate;
  }
}
