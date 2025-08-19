import type { MiddlewareHandler, APIContext, MiddlewareNext } from "astro";
import { logger } from "@/lib/logger";

export const authMiddleware: MiddlewareHandler = async (
  { request, locals }: APIContext,
  next: MiddlewareNext
): Promise<Response> => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid authorization token",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error,
    } = await locals.supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired authorization token",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Add user data to locals for easy access in endpoints
    locals.user = user;

    return await next();
  } catch (error) {
    logger.error("Authentication error", error instanceof Error ? error : undefined);

    return new Response(
      JSON.stringify({
        error: "Authentication error",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
