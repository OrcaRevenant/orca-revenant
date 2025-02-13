import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Queue } from "bullmq";

@Injectable()
export class BackfillStatusService {
  private isBackfillComplete = false;
  private readonly checkInterval = 1000;
  private readonly maxWaitTime = 300000;

  constructor(
    @InjectQueue("backfill") public readonly queue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.waitForBackfill();
  }

  private async waitForBackfill(): Promise<void> {
    const startTime = Date.now();

    while (!this.isBackfillComplete) {
      const [activeJobs, waitingJobs] = await Promise.all([
        this.queue.getActive(),
        this.queue.getWaiting(),
      ]);

      if (activeJobs.length === 0 && waitingJobs.length === 0) {
        setTimeout(() => {
          this.isBackfillComplete = true;
          this.eventEmitter.emit("backfill.completed");
        }, 3000);
        break;
      }

      if (Date.now() - startTime > this.maxWaitTime) {
        throw new Error("Timeout waiting for price backfill to complete");
      }

      await new Promise((resolve) => setTimeout(resolve, this.checkInterval));
    }
  }

  isReady(): boolean {
    return this.isBackfillComplete;
  }
}
