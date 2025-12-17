import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { DB } from "@orca/types";
import supabaseConfig from "./supabase.config";

@Injectable()
export class SupabaseService {
  private readonly instance: SupabaseClient<DB>;

  constructor(
    @Inject(supabaseConfig.KEY)
    private readonly config: ConfigType<typeof supabaseConfig>
  ) {
    if (!config.url) {
      throw new Error(
        `SUPABASE_URL is required but was not provided. Current value: ${config.url}`
      );
    }

    if (!config.roleKey) {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY is required but was not provided. Current value: ${config.roleKey}`
      );
    }

    // Validate URL format
    try {
      new URL(config.url);
    } catch {
      throw new Error(
        `SUPABASE_URL is invalid: "${config.url}". It must be a valid URL (e.g., http://localhost:54321 or https://your-domain.com)`
      );
    }

    this.instance = createClient<DB>(config.url, config.roleKey);
  }

  getClient() {
    return this.instance;
  }
}
