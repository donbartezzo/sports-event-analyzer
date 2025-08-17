import type { APIRoute } from "astro";
import { createSupabaseServer } from "../../../lib/supabase/server";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email } = await request.json();

    const supabase = createSupabaseServer({ cookies, headers: request.headers });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/new-password`,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Wystąpił błąd podczas wysyłania linku resetującego hasło" }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: "Link do resetowania hasła został wysłany na podany adres email" }), {
      status: 200,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }), { status: 500 });
  }
};
