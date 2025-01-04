import { SupabaseService } from "@/common/supabase/supabase.service";
import { Injectable } from "@nestjs/common";
import { Asset } from "./asset.types";

@Injectable()
export class AssetRepository {
    private readonly table = "asset";

    constructor(private readonly supabaseService: SupabaseService) {}

    async findAll(): Promise<Asset[]> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.from(this.table).select("*");
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
}
