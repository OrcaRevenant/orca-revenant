import { SupabaseService } from "@/common/supabase/supabase.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreatePortfolio, Portfolio, UpdatePortfolio } from "./portfolio.types";

@Injectable()
export class PortfolioRepository {
    private readonly table = "portfolio";

    constructor(private readonly supabaseService: SupabaseService) {}

    async create(payload: CreatePortfolio): Promise<Portfolio> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).insert(
            payload,
        )
            .select(`*`).single();

        if (error) {
            throw new Error(`Error creating record: ${error.message}`);
        }
        return data;
    }

    async update(
        id: string,
        payload: UpdatePortfolio,
    ): Promise<Portfolio> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).update(payload)
            .eq("user_id", payload.user_id)
            .eq("id", id).select(`*`).single();

        if (error) {
            throw new Error(
                `Error updating record with ID ${id}: ${error.message}`,
            );
        }
        return data;
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).delete().eq(
            "user_id",
            userId,
        ).eq(
            "id",
            id,
        ).select().single();

        if (!data) {
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
        }

        if (error) {
            throw new Error(
                `Error deleting record with ID ${id}: ${error.message}`,
            );
        }

        return true;
    }

    async findByUserId(userId: string): Promise<Portfolio[]> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).select("*").eq(
            "user_id",
            userId,
        );
        if (error) {
            throw new Error(
                `Error fetching records for user ID ${userId}: ${error.message}`,
            );
        }
        return data;
    }

    async findOneByUserId(id: string, userId: string): Promise<Portfolio> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).select("*").eq(
            "user_id",
            userId,
        ).eq("id", id).single();

        if (error) {
            throw new Error(
                `Error fetching records for user ID ${userId}: ${error.message}`,
            );
        }
        return data;
    }
}
