import { SupabaseService } from "@/common/supabase/supabase.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ConnectionRepository {
    private readonly table = "connection";

    constructor(private readonly supabaseService: SupabaseService) {}

    async findAll() {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).select("*");
        if (error) {
            throw new Error(`Error fetching data: ${error.message}`);
        }

        return data;
    }

    async findOne(name: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from(this.table)
            .select("*")
            .eq("name", name)
            .single();
        if (error) {
            throw new Error(
                `Error fetching record with Name ${name}: ${error.message}`,
            );
        }

        return data;
    }
}
