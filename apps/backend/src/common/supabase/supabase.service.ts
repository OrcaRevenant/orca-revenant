import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import supabaseConfig from "./supabase.config";
import { DB } from "@orca/types";

@Injectable()
export class SupabaseService {
    private readonly instance: SupabaseClient<DB>;

    constructor(
        @Inject(supabaseConfig.KEY) private readonly config: ConfigType<
            typeof supabaseConfig
        >,
    ) {
        this.instance = createClient<DB>(
            config.url,
            config.roleKey,
        );
    }

    getClient() {
        return this.instance;
    }
}
