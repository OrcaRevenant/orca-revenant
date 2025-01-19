import { Module } from "@nestjs/common";
import { TransactionRepository } from "./transaction.repository";
import { DatabaseModule } from "@/database/database.module";

@Module({
    imports: [DatabaseModule],
    providers: [TransactionRepository],
    exports: [TransactionRepository],
})
export class TransactionModule {}
