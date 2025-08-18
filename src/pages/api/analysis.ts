import { z } from "zod";
import type { APIRoute } from "astro";
import type { PaginationParams } from "../../types";
import { AnalysisService } from "../../lib/services/analysis.service";
import { ValidationError } from "../../lib/errors/validation.error";
import { DatabaseError } from "../../lib/errors/database.error";

// Schema walidacji query params dla GET
const getAnalysesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  analysis_type_id: z.coerce.number().optional(),
});

// Schema walidacji wejścia dla POST
const createAnalysisSchema = z
  .object({
    user_id: z.string(),
    analysis_type_id: z.number(),
    parameters: z.any(),
  })
  .required();

export const get: APIRoute = async ({ url, locals }) => {
  try {
    const params = Object.fromEntries(url.searchParams.entries());
    const validatedParams = getAnalysesQuerySchema.parse(params);

    const analysisService = new AnalysisService(locals.supabase);
    const {
      data: { user },
      error: userError,
    } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401 });
    }

    const result = await analysisService.getAnalyses(user.id, validatedParams as PaginationParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: error.message,
        }),
        { status: 400 }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};

export const post: APIRoute = async ({ request, locals }) => {
  try {
    // Parsuj i waliduj dane wejściowe
    const requestData = await request.json();
    const validationResult = createAnalysisSchema.safeParse(requestData);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input data",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const input = validationResult.data;
    const analysisService = new AnalysisService(locals.supabase);
    const {
      data: { user },
      error: userError,
    } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401 });
    }

    // Utwórz analizę
    try {
      const analysis = await analysisService.createAnalysis(
        {
          user_id: input.user_id,
          analysis_type_id: input.analysis_type_id,
          parameters: input.parameters,
        },
        user.id
      );

      return new Response(JSON.stringify(analysis), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return new Response(
          JSON.stringify({
            error: error.message,
            details: error.details,
          }),
          { status: error.statusCode }
        );
      }

      if (error instanceof DatabaseError) {
        await analysisService.logError(error, user.id, input);
        return new Response(
          JSON.stringify({
            error: error.message,
          }),
          { status: error.statusCode }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
