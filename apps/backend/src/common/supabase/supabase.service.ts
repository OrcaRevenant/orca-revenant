import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import supabaseConfig from "./supabase.config";

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
    private instance: SupabaseClient;

    constructor(
        @Inject(supabaseConfig.KEY) private readonly config: ConfigType<
            typeof supabaseConfig
        >,
    ) {
        this.instance = createClient(
            config.url,
            config.roleKey,
        );
    }

    getClient(): SupabaseClient {
        return this.instance;
    }
}
