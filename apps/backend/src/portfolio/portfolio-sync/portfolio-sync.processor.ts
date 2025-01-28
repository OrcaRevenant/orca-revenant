import { Processor, WorkerHost } from "@nestjs/bullmq";
import { PortfolioSyncService } from "./portfolio-sync.service";
import { Job } from "bullmq";
import { Portfolio } from "@/portfolio/portfolio.types";

@Processor("portfolio-sync", { concurrency: 5, lockDuration: 300000 })
export class PortfolioSyncProcessor extends WorkerHost {
    constructor(private readonly portfolioSyncService: PortfolioSyncService) {
        super();
    }

    async process(job: Job<Portfolio>) {
        const portfolio = job.data;
        await this.portfolioSyncService.sync(portfolio);
    }
}
