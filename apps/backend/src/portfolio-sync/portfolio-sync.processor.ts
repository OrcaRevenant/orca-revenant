import { Processor, WorkerHost } from "@nestjs/bullmq";
import { PortfolioSyncService } from "./portfolio-sync.service";
import { Job } from "bullmq";
import { Portfolio } from "@/portfolio/portfolio.types";

@Processor("portfolio-sync")
export class PortfolioSyncProcessor extends WorkerHost {
    constructor(private readonly portfolioSyncService: PortfolioSyncService) {
        super();
    }

    async process(job: Job<Portfolio>) {
        const portfolio = job.data;
        await this.portfolioSyncService.syncTransactions(portfolio);
    }
}
