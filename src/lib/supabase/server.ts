import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '../../db/types';

export const cookieOptions: CookieOptions = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 dni
};

export const createSupabaseServer = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return context.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          context.cookies.set(name, value, { ...cookieOptions, ...options });
        },
        remove(name: string, options?: CookieOptions) {
          context.cookies.delete(name, { ...cookieOptions, ...options });
        },
      },
    },
  );

  return supabase;
};
