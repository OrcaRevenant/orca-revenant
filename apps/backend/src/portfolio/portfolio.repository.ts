import { SupabaseService } from "@/common/supabase/supabase.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {
    CreatePortfolio,
    CreatePortfolioAsset,
    Portfolio,
    PortfolioAsset,
    UpdatePortfolio,
} from "./portfolio.types";
import { UniqueIdentifier } from "@/connection/connection.abstract";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";

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
        id: UniqueIdentifier,
        payload: UpdatePortfolio,
    ): Promise<Portfolio> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).update(payload)
            .eq("user_id", payload.user_id)
            .eq("id", id).select(`*`).single();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    }

    async delete(
        id: UniqueIdentifier,
        userId: UniqueIdentifier,
    ): Promise<boolean> {
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
            throw new Error(error.message);
        }

        return true;
    }

    async findByUserId(userId: UniqueIdentifier): Promise<Portfolio[]> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).select("*").eq(
            "user_id",
            userId,
        );
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }

    async findAll(): Promise<Portfolio[]> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).select("*");
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }

    async findOneByUserId(
        id: UniqueIdentifier,
        userId: UniqueIdentifier,
    ): Promise<Portfolio> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).select("*").eq(
            "user_id",
            userId,
        ).eq("id", id).single();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    }

    async updateStatus(
        portfolio: Portfolio,
        status: Portfolio[`status`],
    ): Promise<Portfolio> {
        const { data, error } = await this.supabaseService.getClient()
            .from("portfolio")
            .update({
                status,
                last_sync_at: new Date().toISOString(),
            })
            .eq("id", portfolio.id).eq("user_id", portfolio.user_id).select(`*`)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async isPortfolioOwner(
        portfolioId: UniqueIdentifier,
        userId: UniqueIdentifier,
    ): Promise<boolean> {
        const { data, error } = await this.supabaseService.getClient()
            .from("portfolio")
            .select("id, user_id")
            .eq("id", portfolioId)
            .single();

        if (error || !data) {
            return false;
        }

        return data.user_id === userId;
    }

    async findUnsyncedPortfolios(minutes: number) {
        const fiveMinutesAgo = new Date(Date.now() - minutes * 60 * 1000)
            .toISOString();

        const { data, error } = await this.supabaseService.getClient()
            .from("portfolio")
            .select("*")
            .or(`last_sync_at.is.null,last_sync_at.lt.${fiveMinutesAgo}`);

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async createManyPortfolioAssets(
        assets: CreatePortfolioAsset[],
    ) {
        const client = this.supabaseService.getClient();

        const { error } = await client
            .from("portfolio_assets")
            .upsert(assets, { onConflict: `asset, portfolio_id` });

        if (error) {
            throw new Error(`Error creating record: ${error.message}`);
        }

        return true;
    }

    async findPortfolioAssets(
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        const client = this.supabaseService.getClient();

        const { limit, skip } = pageOptionsDto;

        const { data, count, error } = await client
            .from("portfolio_assets")
            .select(`*, portfolio!inner(user_id), asset(symbol, name, logo)`, {
                count: "exact",
            })
            .eq("portfolio_id", portfolioId)
            .eq("portfolio.user_id", userId)
            .range(skip, skip + limit - 1);

        if (error) {
            throw new Error(
                `Error retrieving portfolio assets: ${error.message}`,
            );
        }

        const pageMetaDto = new PageMetaDto({
            itemCount: count,
            pageOptionsDto,
        });

        return new PageDto<PortfolioAsset>(data, pageMetaDto);
    }

    async findAllPortfolioAssets(
        portfolioId: string,
        userId: string,
    ) {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from("portfolio_assets")
            .select(
                `*, portfolio!inner(user_id), asset(symbol, name, logo)`,
            )
            .eq("portfolio_id", portfolioId)
            .eq("portfolio.user_id", userId);

        if (error) {
            throw new Error(
                `Error retrieving portfolio assets: ${error.message}`,
            );
        }

        return data;
    }
}
