import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { JobData } from "./backfill.types";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { PriceService } from "../price.service";

dayjs.extend(duration);

@Processor("backfill", { concurrency: 5, lockDuration: 300000 })
export class BackfillProcessor extends WorkerHost {
  constructor(private readonly priceService: PriceService) {
    super();
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<JobData>) {
    const timeTakenMs = job.finishedOn - job.processedOn;
    const timeTaken = dayjs.duration(timeTakenMs);

    console.log(
      `job ${job.id} of type ${job.name} has been completed (${timeTaken.asSeconds()}s)`,
    );
  }

  async process(job: Job<JobData>) {
    const { asset, from, to, resolution } = job.data;

    console.log(
      `Backfilling for ${asset} from ${from} to ${to} with the resolution of ${resolution} minutes`,
    );
    try {
      const historicalPrices = await this.priceService.getAssetHistoricalPrice(
        asset,
        new Date(from),
        new Date(to),
        resolution,
      );

      await this.priceService.bulkInsert(historicalPrices);
    } catch (error) {
      console.log(error);
    }
  }
}
