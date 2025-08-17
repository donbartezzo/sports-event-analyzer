/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly API_SPORTS_KEY: string; // server-only
  readonly API_FOOTBALL_BASE_URL?: string; // optional override, server-only
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
