// @TODO: TMP?
import { defineMiddleware } from 'astro:middleware'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../db/types'

export const onRequest = defineMiddleware(async ({ request, locals, cookies }, next) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

  locals.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

  // Get access token from cookie
  const accessToken = cookies.get('sb-access-token')
  const refreshToken = cookies.get('sb-refresh-token')

  if (accessToken && refreshToken) {
    const { data: { session }, error } = await locals.supabase.auth.setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value
    })

    if (error) {
      cookies.delete('sb-access-token', { path: '/' })
      cookies.delete('sb-refresh-token', { path: '/' })
    }

    locals.session = session
  }

  return next()
})
