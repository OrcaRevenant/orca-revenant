import { Injectable } from "@nestjs/common";
import { Transaction } from "./transaction.types";
import { PageDto, PageMetaDto, PageOptionsDto } from "@/pagination/dto";
import { DatabaseService } from "@/database/database.service";

@Injectable()
export class TransactionRepository {
    private readonly table = "transaction";
    constructor(private readonly db: DatabaseService) {}

    private serialize(transaction: any): Transaction {
        return {
            ...transaction,
        };
    }

    async createMany(transactions: Partial<Transaction>[]): Promise<boolean> {
        const results = await this.db.query
            .insertInto(this.table)
            .values(transactions)
            .onConflict((oc) =>
                oc
                    .columns(["hash"])
                    .doNothing()
            )
            .execute();

        if (!results) {
            throw new Error(`Error inserting transactions.`);
        }

        return true;
    }

    async findAllByPortfolioId(
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ): Promise<PageDto<Transaction>> {
        const { limit, skip } = pageOptionsDto;

        const results = await this.db.query
            .selectFrom(this.table)
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
