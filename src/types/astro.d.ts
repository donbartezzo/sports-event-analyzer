import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

declare module 'astro' {
  interface Locals {
    supabase: SupabaseClient;
    user?: User;
  }
}
