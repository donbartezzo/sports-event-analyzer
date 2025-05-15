import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServer } from '../lib/supabase/server';
import type { User } from '@supabase/supabase-js';

// Type declaration for user in locals
declare module 'astro' {
  interface Locals {
    user?: User;
  }
}

// Public paths - accessible without authentication
const PUBLIC_PATHS = [
  // Auth pages
  '/login',
  '/reset-password',
  '/new-password',
  // Auth API endpoints
  '/api/auth/login',
  '/api/auth/reset-password',
  '/api/auth/new-password',
  '/api/auth/logout'
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Skip auth check for public paths
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return next();
    }

    const supabase = createSupabaseServer({
      cookies,
      headers: request.headers,
    });

    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Auth error:', error.message);
      return redirect('/login');
    }

    if (user) {
      // Store user data in locals for access in routes/components
      locals.user = user;
      return next();
    }

    // Redirect to login for protected routes
    return redirect('/login');
  },
);
