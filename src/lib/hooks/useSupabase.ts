import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { supabaseClient } from '../supabase/client';

export function useSupabase() {
  return { supabase: supabaseClient };
}
