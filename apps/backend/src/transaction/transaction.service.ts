import { Injectable } from "@nestjs/common";
import { Transaction } from "./transaction.types";
import { PageOptionsDto } from "@/pagination/dto";
import { TransactionRepository } from "./transaction.repository";

@Injectable()
export class TransactionService {
    constructor(
        private readonly transactionRepository: TransactionRepository,
    ) {}

    async insert(transactions: Partial<Transaction>[]) {
        return this.transactionRepository.insert(transactions);
    }

    async findByPortfolioIdPaginated(
        portfolioId: string,
        userId: string,
        pageOptionsDto: PageOptionsDto,
    ) {
        return this.transactionRepository.findByPortfolioIdPaginated(
            portfolioId,
            userId,
            pageOptionsDto,
        );
    }
}
