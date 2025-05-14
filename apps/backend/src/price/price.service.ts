import dayjs, { Dayjs } from "dayjs";
import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import {
  EventEmitter2,
  EventEmitterReadinessWatcher,
} from "@nestjs/event-emitter";
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
    private readonly priceProviderRegistry: PriceProviderRegistry,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventEmitterReadinessWatcher: EventEmitterReadinessWatcher
  ) {
    super();
  }

  onModuleInit() {
    this.bootstrap();
  }

  private async bootstrap() {
    await this.priceProviderRegistry.init();

    await this.backfillService.queue.pause();
    await this.backfillService.queue.drain();
    await this.backfillService.queue.obliterate({ force: true });

    // Run initial backfill
    await this.performBackfill();

    while (true) {
      const jobCounts = await this.backfillService.queue.getJobCounts();
      if (jobCounts.active === 0 && jobCounts.waiting === 0) {
        await this.backfillService.queue.drain();

        await this.eventEmitterReadinessWatcher.waitUntilReady();
        this.eventEmitter.emit("backfill.completed");

        await this.performPriceUpdate();
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async performPriceUpdate() {
    const job = new CronJob(this.config.updateCron, async () => {
      const jobCounts = await this.backfillService.queue.getJobCounts();
      // Only run if there are no active or waiting jobs
      if (jobCounts.active === 0 && jobCounts.waiting === 0) {
        await this.performBackfill();
      }
    });

    this.schedulerRegistry.addCronJob("backfill", job);
    job.start();
  }

  private async performBackfill() {
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
          return; // Skip backfill if no gap or gap is too small
        }

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

    const rawPrices = await provider.getHistoricalPrice(
      asset,
      from,
      to,
      resolution
    );

    const validFromDate = dayjs(from);
    const validToDate = dayjs(to);

    // Filter prices to ensure they are strictly within the requested [from, to] range.
    // This guards against providers returning out-of-bound data (e.g., future prices).
    const filteredPrices = rawPrices.filter((p) => {
      const priceTime = dayjs(p.time);
      return (
        !priceTime.isBefore(validFromDate) && !priceTime.isAfter(validToDate)
      );
    });

    return filteredPrices;
  }

  async bulkInsert(prices: Price[]) {
    return this.priceRepository.bulkInsertUsingCopy(prices);
  }

  getDefaultQuote(): string {
    return this.config.defaultQuote;
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

    // Standardize to start of minute for comparison and return
    const standardizedLastPriceDate = lastPriceDate.startOf("minute");
    const standardizedCurrentDate = currentDate.startOf("minute");

    if (standardizedLastPriceDate.isAfter(standardizedCurrentDate)) {
      // If the last known price is in the future (after current minute),
      // start tracking from the current minute.
      return standardizedCurrentDate;
    } else {
      // Otherwise, start tracking from the minute of the last known price.
      return standardizedLastPriceDate;
    }
  }
}
