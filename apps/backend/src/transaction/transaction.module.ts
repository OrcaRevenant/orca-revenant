import { Module } from "@nestjs/common";
import { TransactionRepository } from "./transaction.repository";
import { SupabaseModule } from "@/common/supabase/supabase.module";

@Module({ imports: [SupabaseModule], providers: [TransactionRepository] })
export class TransactionModule {}
