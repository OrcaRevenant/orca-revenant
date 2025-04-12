import { Injectable } from "@nestjs/common";
import { Transaction } from "./transaction.types";
import { PageOptionsDto } from "@/pagination/dto";
import { TransactionRepository } from "./transaction.repository";

@Injectable()
export class TransactionService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async insert(transactions: Partial<Transaction>[]) {
    return this.transactionRepository.insert(transactions);
  }

  async getAllByPortfolioId(portfolioIds: string | string[], userId: string) {
    return this.transactionRepository.findAllByPortfoliosId(
      portfolioIds,
      userId
    );
  }

  async getAllByPortfolioIdPaginated(
    id: string | string[],
    userId: string,
    pageOptionsDto: PageOptionsDto
  ) {
    return this.transactionRepository.findByPortfoliosIdPaginated(
      id,
      userId,
      pageOptionsDto
    );
  }
}
