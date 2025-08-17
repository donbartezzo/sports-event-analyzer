import { createClient } from "@supabase/supabase-js";
export type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Use PUBLIC_ prefixed variables for client-side
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!supabaseAnonKey) throw new Error("SUPABASE_KEY is required");

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
