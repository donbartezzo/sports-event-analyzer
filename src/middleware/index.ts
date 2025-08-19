import { defineMiddleware } from "astro:middleware";
import { createSupabaseServer } from "../lib/supabase/server";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

// Type declaration for user in locals
declare module "astro" {
  interface Locals {
    user?: User;
    // Attach server-side Supabase client for API routes
    supabase?: ReturnType<typeof createSupabaseServer>;
  }
}

// Public paths - accessible without authentication
const PUBLIC_PATHS = [
  // Auth pages
  "/login",
  "/reset-password",
  "/new-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/reset-password",
  "/api/auth/new-password",
  "/api/auth/logout",
  // Public data APIs (read-only)
  "/api/leagues",
  "/api/events",
  // AI analysis generation (server-side, safe for MVP)
  "/api/analysis/generate",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Allow all nested routes under selected public API roots
  if (pathname.startsWith("/api/events/")) return true;
  if (pathname.startsWith("/api/leagues/")) return true;
  return false;
}

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Always create and attach Supabase client for downstream usage (also on public paths)
  const supabase = createSupabaseServer({ cookies, headers: request.headers });
  locals.supabase = supabase;

  // E2E mode: bypass auth checks entirely to allow tests to run
  if (process.env.E2E === "1") {
    return next();
  }

  // Skip auth check for public paths
  if (isPublicPath(url.pathname)) {
    return next();
  }

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logger.error("Auth error", error);
    return redirect("/login");
  }

  if (user) {
    // Store user data in locals for access in routes/components
    locals.user = user;
    return next();
  }

  // Redirect to login for protected routes
  return redirect("/login");
});
