import type { APIRoute } from 'astro';
import { createSupabaseServer } from '../../../lib/supabase/server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const supabase = createSupabaseServer({ cookies, headers: request.headers });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Wystąpił błąd podczas wylogowywania' }),
        { status: 400 }
      );
    }

    return redirect('/login');
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Wystąpił błąd podczas przetwarzania żądania' }),
      { status: 500 }
    );
  }
};
