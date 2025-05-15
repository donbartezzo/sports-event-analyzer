import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export const createSupabaseClient = () => {
  const supabase = createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );

  return supabase;
};

// Create a singleton instance
export const supabaseClient = createSupabaseClient();
