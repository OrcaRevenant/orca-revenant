import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Resolution } from "../price.abstract";

@Injectable()
export class BackfillService {
    constructor(
        @InjectQueue("backfill") public readonly queue: Queue,
    ) {
    }

    async addBackfillJob(
        asset: string,
        from: Date,
        to: Date,
        resolution: Resolution,
    ) {
        await this.queue.add(`${asset}-backfill-job`, {
            asset,
            from,
            to,
            resolution,
        }, {
            attempts: 3,
            backoff: 5000,
        });
    }
}
