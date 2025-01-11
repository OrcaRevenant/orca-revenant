import { Injectable } from "@nestjs/common";
import { SupabaseService } from "@/common/supabase/supabase.service";
import { CreatePrice } from "./price.types";
import dayjs from "dayjs";

@Injectable()
export class PriceRepository {
    private readonly table = "price";

    constructor(private readonly supabaseService: SupabaseService) {}

    async clean(): Promise<boolean> {
        const { data, error } = await this.supabaseService
            .getClient()
            .from(this.table)
            .delete()
            .neq("id", -1);

        if (error || !data) {
            return false;
        }

        return true;
    }

    async getLastPriceTime(asset: string): Promise<Date | null> {
        const { data, error } = await this.supabaseService
            .getClient()
            .from(this.table)
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

    async insertMany(
        price: CreatePrice[],
    ): Promise<void> {
        const { error } = await this.supabaseService
            .getClient()
            .from(this.table)
            .insert(price);

        if (error) {
            throw new Error(`Failed to insert prices: ${error.message}`);
        }
    }

    async insert(
        price: CreatePrice,
    ): Promise<void> {
        const { error } = await this.supabaseService
            .getClient()
            .from(this.table)
            .insert(price);

        if (error) {
            throw new Error(`Failed to insert prices: ${error.message}`);
        }
    }

    async getNearestPrice(
        asset: string,
        time: string,
    ): Promise<number | null> {
        const client = this.supabaseService.getClient();
        const timestamp = dayjs(time).toISOString();

        const { data, error } = await client
            .from(this.table)
            .select("*")
            .eq("asset", asset)
            .order(
                `ABS(EXTRACT(EPOCH FROM time - TIMESTAMP '${timestamp}'))`,
                { ascending: true },
            )
            .limit(1);

        if (error) {
            throw new Error(`Error retrieving price: ${error.message}`);
        }

        if (data.length === 0) return null;

        const nearestPrice = data[0];
        const timeDiffInSeconds = Math.abs(
            dayjs(timestamp).diff(
                dayjs(nearestPrice.time),
                "seconds",
            ),
        );

        // If the gap is more than 2 minutes (120 seconds), return null
        return timeDiffInSeconds <= 120 ? nearestPrice.price : null;
    }
}
