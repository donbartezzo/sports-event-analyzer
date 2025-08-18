import { supabaseClient } from "../supabase/client";

export function useSupabase() {
  return { supabase: supabaseClient };
}
