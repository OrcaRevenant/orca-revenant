// price.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("price", () => ({
    // When there is no existing price record, backfill starting from this many years ago.
    initialLookbackYears: 3,
    // The step (in minutes) to be used when creating backfill jobs.
    backfillStep: 3,
    // The cron schedule for updating asset prices.
    updateCron: "*/3 * * * *",
}));
