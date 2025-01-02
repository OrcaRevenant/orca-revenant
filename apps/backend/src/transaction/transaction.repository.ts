import { SupabaseService } from "@/common/supabase/supabase.service";
import { Injectable } from "@nestjs/common";
import { CreateTransaction, Transaction } from "./transaction.types";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";

@Injectable()
export class TransactionRepository {
    private readonly table = "transaction";

    constructor(private readonly supabaseService: SupabaseService) {}

    async create(payload: CreateTransaction): Promise<Transaction> {
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

    async createMany(payload: CreateTransaction[]): Promise<boolean> {
        const client = this.supabaseService.getClient();
        const { error } = await client.from(this.table).upsert(
            payload,
            { onConflict: `hash` },
        );

        if (error) {
            throw new Error(`Error creating record: ${error.message}`);
        }
        return true;
    }

    async findAllByPortfolioId(
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ): Promise<PageDto<Transaction>> {
        const client = this.supabaseService.getClient();

        const { limit, skip } = pageOptionsDto;

        const { data, count, error } = await client
            .from(this.table)
            .select(
                `
                *,
                portfolio!inner(user_id)
            `,
                { count: "exact" },
            )
            .eq("portfolio_id", portfolioId)
            .eq("portfolio.user_id", userId)
            .range(skip, skip + limit - 1);

        if (error) {
            throw new Error(`Error retrieving transactions: ${error.message}`);
        }

        const pageMetaDto = new PageMetaDto({
            itemCount: count,
            pageOptionsDto,
        });

        return new PageDto<Transaction>(data, pageMetaDto);
    }
}
