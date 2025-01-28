import { Injectable } from "@nestjs/common";
import { Transaction } from "./transaction.types";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";
import { DatabaseService } from "@/database/database.service";
import { sql } from "kysely";

@Injectable()
export class TransactionRepository {
    constructor(private readonly db: DatabaseService) {}

    private serialize(result: any): Transaction {
        return {
            id: result.id,
            hash: result.hash,
            portfolio_id: result.portfolio_id,
            asset: result.asset,
            amount: result.amount,
            time: result.time,
            type: result.type,
            value: result.value,
        };
    }

    async insertMany(transactions: Partial<Transaction>[]): Promise<boolean> {
        const transactionsJsonb = JSON.stringify(transactions);
        const records =
            await sql`SELECT insert_transactions_with_values(${transactionsJsonb}::jsonb)`
                .execute(this.db.query);
        return records.rows.length > 0;
    }

    async findByPortfolioIdPaginated(
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ): Promise<PageDto<Transaction>> {
        const { limit, skip } = pageOptionsDto;

        const results = await this.db.query
            .selectFrom("transaction")
            .innerJoin("portfolio", "portfolio.id", "transaction.portfolio_id")
            .innerJoin("asset", "asset.symbol", "transaction.asset")
            .selectAll("transaction")
            .select([
                (eb) => eb.ref("portfolio.user_id").as("portfolio_user_id"),
                (eb) => eb.ref("asset.symbol").as("symbol"),
                (eb) => eb.ref("asset.name").as("name"),
                (eb) => eb.ref("asset.logo").as("logo"),
                (eb) =>
                    eb.fn
                        .countAll()
                        .over()
                        .as("total_count"),
            ])
            .where("transaction.portfolio_id", "=", portfolioId)
            .where("portfolio.user_id", "=", userId)
            .limit(limit)
            .offset(skip)
            .execute();

        if (results.length === 0) {
            return new PageDto<Transaction>(
                [],
                new PageMetaDto({ itemCount: 0, pageOptionsDto }),
            );
        }

        const totalCount = Number(results[0].total_count);

        const pageMetaDto = new PageMetaDto({
            itemCount: totalCount,
            pageOptionsDto,
        });

        return new PageDto<Transaction>(
            results.map(this.serialize),
            pageMetaDto,
        );
    }
}
