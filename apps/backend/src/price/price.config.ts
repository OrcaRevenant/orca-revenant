// price.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("price", () => ({
    // When there is no existing price record, backfill starting from this many years ago.
    initialLookbackYears: 5,
    // The step (in minutes) to be used when creating backfill jobs.
    backfillStep: 2,
    // The cron schedule for updating asset prices.
    updateCron: "*/2 * * * *",
}));
