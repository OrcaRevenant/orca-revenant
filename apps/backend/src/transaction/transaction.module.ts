import { Module } from "@nestjs/common";
import { TransactionRepository } from "./transaction.repository";
import { DatabaseModule } from "@/database/database.module";
import { TransactionService } from "./transaction.service";

@Module({
    imports: [DatabaseModule],
    providers: [TransactionRepository, TransactionService],
    exports: [TransactionRepository, TransactionService],
})
export class TransactionModule {}
