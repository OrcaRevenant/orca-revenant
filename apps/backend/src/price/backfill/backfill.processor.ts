import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Inject } from "@nestjs/common";
import { PriceAbstract } from "../price.abstract";
import { JobData } from "./backfill.types";
import { PriceRepository } from "../price.repository";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

@Processor("backfill", { concurrency: 5, lockDuration: 300000 })
export class BackfillProcessor extends WorkerHost {
  constructor(
    @Inject("PriceProvider") private readonly priceProvider: PriceAbstract,
    private readonly priceRepository: PriceRepository,
  ) {
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
      `Backfilling for ${asset} from ${from} to ${to}`,
    );

    const historicalPrices = await this.priceProvider.getAssetHistoricalPrice(
      asset,
      from,
      to,
      resolution,
    );

    try {
      await this.priceRepository.bulkInsertUsingCopy(
        historicalPrices,
      );
    } catch (error) {
      console.log(error);
    }
  }
}
