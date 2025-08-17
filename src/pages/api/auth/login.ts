import type { APIRoute } from "astro";
import { createSupabaseServer } from "../../../lib/supabase/server";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const { email, password } = await request.json();

    const supabase = createSupabaseServer({ cookies, headers: request.headers });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Nieprawidłowy email lub hasło" }), { status: 400 });
    }

    return redirect("/dashboard");
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas logowania" }), { status: 500 });
  }
};
