import type { APIRoute } from "astro";
import { createSupabaseServer } from "../../../lib/supabase/server";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const { password } = await request.json();

    const supabase = createSupabaseServer({ cookies, headers: request.headers });

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Wystąpił błąd podczas zmiany hasła" }), { status: 400 });
    }

    return redirect("/login");
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }), { status: 500 });
  }
};
