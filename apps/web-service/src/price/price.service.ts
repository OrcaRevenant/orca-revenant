import { Inject, Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SupabaseService } from "@/supabase/supabase.service";
import { PriceAbstract } from "./price.abstract";
import { Database } from "@orca/types";
import dayjs from "dayjs";

// TODO: Handle concurrency for PriceService
// Ensure that only one process at a time fills price gaps or updates prices for a specific asset.
// Implement a locking mechanism to prevent redundant or conflicting operations.
// Options:
// 1. Use database-level locks (e.g., advisory locks in PostgreSQL).
// 2. Use distributed locks (e.g., with Redis).
// 3. Implement a state flag or status field to manage concurrency within the system.
// This will help avoid race conditions and redundant data writes.
@Injectable()
export class PriceService {
    constructor(
        @Inject("PriceProvider") private readonly priceProvider: PriceAbstract,
        private readonly supabaseService: SupabaseService,
    ) {
        this.backfillAndUpdateCurrentPrices();
    }

    @Cron("0 * * * * *")
    async updateCurrentPrices() {
        const assets = await this.getAssets();

        for (const asset of assets) {
            await this.updateCurrentPrice(asset.symbol);
        }
        console.log("Finished updating current prices.");
    }

    async backfillAndUpdateCurrentPrices() {
        console.log("Starting backfill process...");
        const assets = await this.getAssets();

        for (const asset of assets) {
            const backfillComplete = await this.performBackfill(asset.symbol);

            if (backfillComplete) {
                console.log(
                    `Backfill completed for asset: ${asset.symbol}. Switching to current price updates.`,
                );
                await this.updateCurrentPrice(asset.symbol);
            }
        }
        console.log(
            "Backfill process completed. Switching to scheduled updates.",
        );
    }

    private async performBackfill(assetSymbol: string): Promise<boolean> {
        const currentTimestamp = dayjs();
        const startTrackingFromDate = await this.determineStartTrackingDate(
            assetSymbol,
            currentTimestamp,
        );

        console.log(
            `Backfilling data for asset: ${assetSymbol}`,
            `Start: ${startTrackingFromDate.toISOString()}`,
            `End: ${currentTimestamp.toISOString()}`,
        );

        const timestamps = this.generateTimestamps(
            startTrackingFromDate,
            currentTimestamp,
        );

        if (timestamps.length === 0) {
            console.log(`No gaps to fill for asset: ${assetSymbol}`);
            return true;
        }

        await this.fillPriceGaps(assetSymbol, timestamps);
        return true;
    }

    private async updateCurrentPrice(assetSymbol: string) {
        const currentPrice = await this.priceProvider.getAssetPriceAtTime(
            assetSymbol,
            new Date(),
        );
        const prices: Database[`public`][`Tables`][`price`][`Insert`][] = [
            {
                asset: assetSymbol,
                price: currentPrice,
                time: new Date().toISOString(),
            },
        ];

        console.log(
            `Updating current price for asset: ${assetSymbol}`,
        );

        await this.savePrice(prices);
    }

    private async fillPriceGaps(asset: string, timestamps: string[]) {
        const prices: Database[`public`][`Tables`][`price`][`Insert`][] = [];

        for (const time of timestamps) {
            const price = await this.priceProvider.getAssetPriceAtTime(
                asset,
                new Date(time),
            );
            prices.push({ asset, price, time });
        }

        await this.savePrice(prices);
    }

    private async getAssets() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from("asset")
            .select("*");

        if (error) {
            console.error("Error fetching assets:", error);
            return [];
        }

        return data;
    }

    private async getLastPriceTime(asset: string): Promise<Date | null> {
        const { data, error } = await this.supabaseService
            .getClient()
            .from("price")
            .select("time")
            .eq("asset", asset)
            .order("time", { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return new Date(data.time);
    }

    private async savePrice(
        prices: Database[`public`][`Tables`][`price`][`Insert`][],
    ) {
        await this.supabaseService.getClient().from("price").insert(prices);
    }

    private async determineStartTrackingDate(
        assetSymbol: string,
        currentTimestamp: dayjs.Dayjs,
    ): Promise<dayjs.Dayjs> {
        const lastPriceTime = await this.getLastPriceTime(assetSymbol);

        if (!lastPriceTime) {
            return currentTimestamp.subtract(10, "minutes");
        }

        const lastPriceDate = dayjs(lastPriceTime);
        return lastPriceDate.isAfter(currentTimestamp)
            ? currentTimestamp
            : lastPriceDate;
    }

    private generateTimestamps(
        start: dayjs.Dayjs,
        end: dayjs.Dayjs,
        interval: number = 1,
    ): string[] {
        if (start.isAfter(end)) {
            console.warn(
                "Start date is after end date. Adjusting start to match end.",
            );
            return [];
        }

        const timestamps: string[] = [];
        let current = start;

        while (current.isBefore(end)) {
            timestamps.push(current.toISOString());
            current = current.add(interval, "minutes");
        }

        return timestamps;
    }
}
