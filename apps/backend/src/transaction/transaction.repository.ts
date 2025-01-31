import { Injectable } from "@nestjs/common";
import { PopulatedTransaction, Transaction } from "./transaction.types";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";
import { DatabaseService } from "@/database/database.service";
import { sql } from "kysely";

@Injectable()
export class TransactionRepository {
    constructor(private readonly db: DatabaseService) {}

    private serialize(result: any): PopulatedTransaction {
        return {
            id: result.id,
            hash: result.hash,
            portfolio: {
                id: result.portfolio_id,
                title: result.portfolio_title,
                connection: {
                    logo: result.connection_logo,
                    name: result.connection_name,
                    title: result.connection_title,
                    type: result.connection_type,
                },
            },
            asset: {
                logo: result.logo,
                name: result.name,
                symbol: result.symbol,
            },
            amount: result.amount,
            time: result.time,
            type: result.type,
            value: result.value,
            portfolio_total_value: 0,
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
    ): Promise<PageDto<PopulatedTransaction>> {
        const { limit, skip } = pageOptionsDto;

        const results = await this.db.query
            .selectFrom("transaction")
            .innerJoin("portfolio", "portfolio.id", "transaction.portfolio_id")
            .innerJoin("asset", "asset.symbol", "transaction.asset")
            .leftJoin(
                "connection",
                "connection.name",
                "portfolio.connection_name",
            )
            .selectAll("transaction")
            .select([
                (eb) => eb.ref("portfolio.user_id").as("portfolio_user_id"),
                (eb) => eb.ref("portfolio.title").as("portfolio_title"),
                (eb) =>
                    eb.ref("portfolio.connection_name").as(
                        "portfolio_connection_name",
                    ),
                (eb) => eb.ref("asset.symbol").as("symbol"),
                (eb) => eb.ref("asset.name").as("name"),
                (eb) => eb.ref("asset.logo").as("logo"),
                (eb) => eb.ref("connection.type").as("connection_type"),
                (eb) => eb.ref("connection.logo").as("connection_logo"),
                (eb) => eb.ref("connection.title").as("connection_title"),
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
            .orderBy("time desc")
            .execute();

        if (results.length === 0) {
            return new PageDto<PopulatedTransaction>(
                [],
                new PageMetaDto({ itemCount: 0, pageOptionsDto }),
            );
        }

        const totalCount = Number(results[0].total_count);

        const pageMetaDto = new PageMetaDto({
            itemCount: totalCount,
            pageOptionsDto,
        });

        return new PageDto<PopulatedTransaction>(
            results.map(this.serialize),
            pageMetaDto,
        );
    }
}
