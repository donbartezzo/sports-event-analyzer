export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import crypto from "node:crypto";
import { logger } from "@/lib/logger";

// Simple discipline guard for MVP
const SUPPORTED_DISCIPLINES = new Set(["football", "basketball", "volleyball", "baseball", "hockey"]);

const BodySchema = z.object({
  eventId: z.string().min(1),
  discipline: z
    .string()
    .toLowerCase()
    .refine((v) => SUPPORTED_DISCIPLINES.has(v), {
      message: "Unsupported discipline",
    }),
  snapshot: z.record(z.unknown()), // full normalized snapshot from upstream APIs
});

function jsonStableStringify(obj: unknown) {
  // Deterministic stringify for checksum
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    return JSON.stringify(obj, keys);
  }
  return JSON.stringify(obj);
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getGroqModel() {
  return import.meta.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

async function callGroq(prompt: string): Promise<{ text: string; model: string }> {
  const apiKey = import.meta.env.GROQ_API_KEY;
  if (!apiKey) {
    // explicit code to make debugging easier
    const err = new Error("MISSING_GROQ_API_KEY") as Error & { code: string };
    err.code = "MISSING_GROQ_API_KEY";
    throw err;
  }
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const fallbackModels = [getGroqModel(), "llama-3.1-8b-instant"];
  const maxRetries = 2;
  const baseTimeoutMs = 20000;
  let attempt = 0;
  let lastErr: unknown;
  let modelUsed = fallbackModels[0];
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), baseTimeoutMs * (attempt + 1));
    try {
      const payload = {
        model: modelUsed,
        temperature: 0.3,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "Jesteś asystentem-analitykiem sportowym. Generujesz zwięzłe, rzetelne analizy meczów w języku polskim.",
          },
          { role: "user", content: prompt },
        ],
      };
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // Auto-switch model if decommissioned
        if (/model_decommissioned|decommissioned/i.test(text) || /has been decommissioned/i.test(text)) {
          const currentIdx = fallbackModels.indexOf(modelUsed);
          const next = fallbackModels[currentIdx + 1];
          if (next) {
            modelUsed = next;
            attempt += 1;
            continue;
          }
        }
        throw new Error(`Groq error: ${res.status} ${res.statusText} ${text}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      return { text: String(content), model: modelUsed };
    } catch (e: unknown) {
      clearTimeout(t);
      lastErr = e;
      if (attempt === maxRetries) break;
      // exponential backoff
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      attempt += 1;
    }
  }
  throw lastErr || new Error("Groq call failed");
}

function buildPrompt(discipline: string, snapshot: unknown) {
  const common = [
    `Dyscyplina: ${discipline}.`,
    "Dane wydarzenia (zwięźle zinterpretuj):",
    "```json",
    JSON.stringify(snapshot, null, 2),
    "```",
    "Wygeneruj analizę po polsku z sekcjami:",
    "- Summary (5-7 punktów kluczowych w bulletach)",
    "- Details (krótka narracja z kontekstem: forma, head-to-head, kluczowi zawodnicy, przewagi taktyczne, ryzyka)",
    "- Recommendations (3-5 zaleceń analitycznych, bez hazardu).",
    "Unikaj spekulacji bez danych. Zwróć tylko czysty tekst w markdown z nagłówkami sekcji.",
  ];
  const hints: Record<string, string[]> = {
    football: [
      "Uwzględnij: formę ostatnich 5 meczów, xG jeśli dostępne, skuteczność stałych fragmentów, pressing, kontuzje/rotacje.",
    ],
    basketball: ["Uwzględnij: offensive/defensive rating, tempo, skuteczność za 3, zbiórki, rotacje i kontuzje."],
    volleyball: ["Uwzględnij: efektywność ataku, blok, liczba błędów własnych, rotacje składu."],
    baseball: ["Uwzględnij: ERA/WHIP pitcherów, bullpen, splity home/away, wydajność ofensywy."],
    hockey: ["Uwzględnij: CF%/xGF% jeśli dostępne, special teams (PP/PK), forma bramkarza, fizyczność."],
  };
  return [...common, ...(hints[discipline] ?? [])].join("\n");
}

function parseMarkdownSections(md: string) {
  // Extremely simple parser to split into sections by headings
  type SectionKey = "summary" | "details" | "recommendations";
  const result: Record<SectionKey, string> = { summary: "", details: "", recommendations: "" };
  let current: SectionKey | null = null;
  md.split(/\r?\n/).forEach((line) => {
    const low = line.toLowerCase();
    if (low.startsWith("## ")) {
      const h = low.slice(3).trim();
      if (h.includes("summary")) current = "summary";
      else if (h.includes("detail")) current = "details";
      else if (h.includes("recommend")) current = "recommendations";
      else current = null;
      return;
    }
    if (current) result[current] += (result[current] ? "\n" : "") + line;
  });
  return result;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const started = Date.now();
  const headers = new Headers({
    "Cache-Control": "no-store",
  });

  try {
    const raw = await request.json();
    const { eventId, discipline, snapshot } = BodySchema.parse(raw);

    // Narrowing helpers for unknown snapshot
    const asRecord = (u: unknown): Record<string, unknown> | null =>
      u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : null;

    // Minimal completeness check (extend later per discipline)
    const s = asRecord(snapshot);
    const teamsRec = s ? asRecord(s["teams"]) : null;
    const fixtureRec = s ? asRecord(s["fixture"]) : null;
    const hasTeams = Boolean(teamsRec?.["home"] && teamsRec?.["away"]);
    const hasDate = Boolean(s?.["date"] || fixtureRec?.["date"]);
    if (!hasTeams || !hasDate) {
      // Log informational incident
      try {
        await locals.supabase?.from("logs").insert({
          event: "analysis_generator",
          type: "info",
          log: { tag: "incomplete_data_for_analysis", eventId, discipline, fields: { hasTeams, hasDate } },
          created_at: new Date().toISOString(),
        });
      } catch {
        // ignore: logging failure should not break request
      }
      return new Response(
        JSON.stringify({
          error: "Brak kompletnych danych do wygenerowania analizy.",
          code: "INCOMPLETE_DATA",
        }),
        { status: 409, headers }
      );
    }

    // Compute checksum of full snapshot
    const checksum = sha256Hex(jsonStableStringify(snapshot));

    // If an analysis with same checksum exists, return it (idempotency)
    try {
      const existingRes = await locals.supabase
        .from("analysis")
        .select("id, content_json, type, finished_at")
        .eq("event_id", eventId)
        .eq("checksum", checksum)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      type ExistingAnalysis = { id: string; content_json?: unknown; type?: string; finished_at?: string } | null;
      const existing = existingRes.data as ExistingAnalysis;
      if (existing) {
        const cj = existing.content_json as Record<string, unknown> | undefined;
        const pick = (k: string) => (cj && typeof cj[k] === "string" ? (cj[k] as string) : "");
        return new Response(
          JSON.stringify({
            data: {
              analysisId: existing.id,
              summary: pick("summary"),
              details: pick("details"),
              recommendations: pick("recommendations"),
              type: existing.type ?? "ai",
              finished_at: existing.finished_at,
            },
          }),
          { status: 200, headers }
        );
      }
    } catch {
      // ignore: existing lookup failure; proceed to generation
    }

    // Prepare timing but do NOT insert analysis yet
    const startedAt = new Date().toISOString();

    const prompt = buildPrompt(discipline, snapshot);
    // Debug: log prompt to server console (dev only)
    try {
      logger.debug("[analysis] groq prompt:", { prompt });
    } catch {
      // ignore: console may be unavailable in some environments
    }
    // Persist prompt (trimmed) to system logs for diagnostics (no FK coupling)
    try {
      await locals.supabase?.from("logs").insert({
        event: "analysis_generator",
        type: "info",
        log: {
          tag: "groq_prompt",
          prompt_len: String(prompt).length,
          prompt: String(prompt).slice(0, 4000),
          event_id: eventId,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // ignore: logging failure should not break request
    }

    let md = "";
    let modelUsed = getGroqModel();
    try {
      const r = await callGroq(prompt);
      md = r.text;
      modelUsed = r.model;
    } catch (groqErr) {
      // classify error
      const msg = String(groqErr);
      const isAbort = /aborted|timeout/i.test(msg);
      const isMissingKey = /MISSING_GROQ_API_KEY|not set/i.test(msg);
      const isHttp = /^Groq error:/i.test(msg);
      const errorId = Math.random().toString(36).slice(2);
      const code = isMissingKey
        ? "MISSING_GROQ_API_KEY"
        : isAbort
          ? "TIMEOUT"
          : isHttp
            ? "HTTP_ERROR"
            : "NETWORK_ERROR";

      // Log error to system logs (avoid FK to analysis that will be deleted)
      try {
        await locals.supabase?.from("logs").insert({
          event: "analysis_generator",
          type: "error",
          log: { tag: "groq_error", code, errorId, msg },
          created_at: new Date().toISOString(),
        });
      } catch {
        // ignore: logging failure during error handling
      }
      const body = { error: "Błąd generowania analizy. Spróbuj ponownie później.", code, errorId };
      return new Response(JSON.stringify(body), { status: isMissingKey ? 500 : 502, headers });
    }

    const sections = parseMarkdownSections(md);

    const finishedAt = new Date().toISOString();
    const duration = Date.now() - started;

    // Insert completed analysis (only after success)
    const insertCompleted = await locals.supabase
      .from("analysis")
      .insert({
        event_id: eventId,
        parameters: { discipline, snapshot },
        type: "ai",
        status: "completed",
        checksum,
        started_at: startedAt,
        finished_at: finishedAt,
        duration_ms: duration,
        created_at: startedAt,
        content_json: {
          summary: sections.summary || md,
          details: sections.details || "",
          recommendations: sections.recommendations || "",
          model: modelUsed,
          md,
        },
      })
      .select("id")
      .single();
    if (insertCompleted.error) {
      // If saving analysis fails, at least log it and return error
      try {
        await locals.supabase?.from("logs").insert({
          event: "analysis_generator",
          type: "error",
          log: { tag: "save_completed_analysis_failed", error: String(insertCompleted.error.message) },
          created_at: new Date().toISOString(),
        });
      } catch {
        // ignore: logging failure should not break request
      }
      return new Response(JSON.stringify({ error: "Błąd zapisu analizy.", code: "DB_ERROR" }), {
        status: 500,
        headers,
      });
    }
    const newId = insertCompleted.data?.id as string;

    // Optional: log groq response received to analysis_logs now that we have analysis_id
    try {
      await locals.supabase?.from("analysis_logs").insert({
        analysis_id: newId,
        event_id: eventId,
        level: "info",
        message: "groq_response_received",
        context: { length: md.length },
        created_at: new Date().toISOString(),
      });
    } catch {
      // ignore: optional analysis_logs insert
    }

    return new Response(
      JSON.stringify({
        data: {
          analysisId: newId,
          summary: sections.summary || md,
          details: sections.details || "",
          recommendations: sections.recommendations || "",
          type: "ai",
          finished_at: finishedAt,
        },
      }),
      { status: 200, headers }
    );
  } catch (err: unknown) {
    try {
      await locals.supabase?.from("logs").insert({
        event: "analysis_generator",
        type: "error",
        log: {
          tag: "analysis_generate_error",
          error: String((err as { message?: unknown } | null)?.message ?? err),
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // ignore: logging failure during error handling
    }
    return new Response(JSON.stringify({ error: "Wewnętrzny błąd serwera." }), { status: 500, headers });
  }
};
