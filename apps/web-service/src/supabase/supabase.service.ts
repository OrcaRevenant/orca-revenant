import { Injectable } from "@nestjs/common";
import { Database } from "@orca/types";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
    private readonly supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient<Database>(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
    }

    getClient(): SupabaseClient<Database> {
        return this.supabase;
    }
}
