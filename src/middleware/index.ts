import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServer } from '../lib/supabase/server';

// Deklaracja typu dla user w locals
declare module 'astro' {
  interface Locals {
    user?: {
      id: string;
      email: string | null;
    };
  }
}

// Ścieżki publiczne - dostępne bez autentykacji
const PUBLIC_PATHS = [
  '/login',
  '/reset-password',
  '/new-password',
  '/api/auth/login',
  '/api/auth/reset-password',
  '/api/auth/new-password'
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Pomijamy sprawdzanie auth dla ścieżek publicznych
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return next();
    }

    const supabase = createSupabaseServer({
      cookies,
      headers: request.headers,
    });

    // Pobieramy sesję użytkownika
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Zapisujemy dane użytkownika w locals
      locals.user = {
        id: user.id,
        email: user.email,
      };
      return next();
    }

    // Przekierowujemy na stronę logowania dla chronionych ścieżek
    return redirect('/login');
  },
);
