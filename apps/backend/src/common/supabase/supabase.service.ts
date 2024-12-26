import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import supabaseConfig from "./supabase.config";
import { Database } from "@orca/types";

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
    private instance: SupabaseClient<Database>;

    constructor(
        @Inject(supabaseConfig.KEY) private readonly config: ConfigType<
            typeof supabaseConfig
        >,
    ) {
        this.instance = createClient<Database>(
            config.url,
            config.roleKey,
        );
    }

    getClient() {
        return this.instance;
    }
}
