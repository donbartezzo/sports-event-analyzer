// @TODO: TMP?
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type { Database }
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']
export type SupabaseClient = typeof supabase
