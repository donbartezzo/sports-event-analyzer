import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    // In Astro, we can access the Supabase client from the window object
    // It's set up in the root layout
    const client = (window as any).supabase as SupabaseClient<Database>;
    setSupabase(client);
  }, []);

  return { supabase: supabase! };
}
