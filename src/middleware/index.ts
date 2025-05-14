import { sequence } from 'astro:middleware';
import type { APIContext, MiddlewareNext, MiddlewareHandler } from 'astro';
import { supabaseClient } from '../db/supabase.client';
import { authMiddleware } from './auth';

// Middleware inicjalizujący Supabase
const initSupabase: MiddlewareHandler = async ({ locals }: APIContext, next: MiddlewareNext): Promise<Response> => {
  locals.supabase = supabaseClient;
  const response = await next();
  return response;
};

// Middleware sprawdzające autoryzację dla endpointów API
const apiAuthMiddleware: MiddlewareHandler = async (context: APIContext, next: MiddlewareNext): Promise<Response> => {
  if (context.url.pathname.startsWith('/api/')) {
    return authMiddleware(context, next);
  }
  const response = await next();
  return response;
};

// Łączymy middleware w odpowiedniej kolejności
export const onRequest = sequence(initSupabase, apiAuthMiddleware);
