import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { UpdateAnalysisCommand } from '../../../types';
import { AnalysisService } from '../../../lib/services/analysis.service';
import { ValidationError } from '../../../lib/errors/validation.error';
import { DatabaseError } from '../../../lib/errors/database.error';

// Schema walidacji parametrów URL
const paramsSchema = z.object({
  id: z.coerce.number()
});

// Schema walidacji danych do aktualizacji
const updateAnalysisSchema = z.object({
  analysis_type_id: z.number().optional(),
  parameters: z.any().optional()
}).strict();

export const get: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = paramsSchema.parse(params);
    const analysisService = new AnalysisService(locals.supabase);
    const { data: { user }, error: userError } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { status: 401 }
      );
    }

    const analysis = await analysisService.getAnalysis(id, user.id);

    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 404 }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

export const put: APIRoute = async ({ request, params, locals }) => {
  try {
    const { id } = paramsSchema.parse(params);
    const requestData = await request.json();
    
    const validationResult = updateAnalysisSchema.safeParse(requestData);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: validationResult.error.errors 
        }),
        { status: 400 }
      );
    }

    const input = validationResult.data as UpdateAnalysisCommand;
    const analysisService = new AnalysisService(locals.supabase);
    const { data: { user }, error: userError } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { status: 401 }
      );
    }

    const analysis = await analysisService.updateAnalysis(id, input, user.id);

    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 404 }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

export const del: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = paramsSchema.parse(params);
    const analysisService = new AnalysisService(locals.supabase);
    const { data: { user }, error: userError } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { status: 401 }
      );
    }

    await analysisService.deleteAnalysis(id, user.id);

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 404 }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
