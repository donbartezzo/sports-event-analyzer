export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import crypto from 'node:crypto';

// Simple discipline guard for MVP
const SUPPORTED_DISCIPLINES = new Set(['football', 'basketball', 'volleyball', 'baseball', 'hockey']);

const BodySchema = z.object({
  eventId: z.string().min(1),
  discipline: z.string().toLowerCase().refine((v) => SUPPORTED_DISCIPLINES.has(v), {
    message: 'Unsupported discipline',
  }),
  snapshot: z.record(z.any()), // full normalized snapshot from upstream APIs
});

function jsonStableStringify(obj: unknown) {
  // Deterministic stringify for checksum
  return JSON.stringify(obj, Object.keys(obj as any).sort());
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getGroqModel() {
  return import.meta.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
}

async function callGroq(prompt: string): Promise<{ text: string; model: string }> {
  const apiKey = import.meta.env.GROQ_API_KEY;
  if (!apiKey) {
    // explicit code to make debugging easier
    const err: any = new Error('MISSING_GROQ_API_KEY');
    err.code = 'MISSING_GROQ_API_KEY';
    throw err;
  }
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const fallbackModels = [
    getGroqModel(),
    'llama-3.1-8b-instant',
  ];
  const maxRetries = 2;
  const baseTimeoutMs = 20000;
  let attempt = 0;
  let lastErr: any;
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
          { role: 'system', content: 'Jesteś asystentem-analitykiem sportowym. Generujesz zwięzłe, rzetelne analizy meczów w języku polskim.' },
          { role: 'user', content: prompt },
        ],
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
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
      const content = data?.choices?.[0]?.message?.content ?? '';
      return { text: String(content), model: modelUsed };
    } catch (e: any) {
      clearTimeout(t);
      lastErr = e;
      if (attempt === maxRetries) break;
      // exponential backoff
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      attempt += 1;
    }
  }
  throw lastErr || new Error('Groq call failed');
}

function buildPrompt(discipline: string, snapshot: any) {
  const common = [
    `Dyscyplina: ${discipline}.`,
    'Dane wydarzenia (zwięźle zinterpretuj):',
    '```json',
    JSON.stringify(snapshot, null, 2),
    '```',
    'Wygeneruj analizę po polsku z sekcjami:',
    '- Summary (5-7 punktów kluczowych w bulletach)',
    '- Details (krótka narracja z kontekstem: forma, head-to-head, kluczowi zawodnicy, przewagi taktyczne, ryzyka)',
    '- Recommendations (3-5 zaleceń analitycznych, bez hazardu).',
    'Unikaj spekulacji bez danych. Zwróć tylko czysty tekst w markdown z nagłówkami sekcji.',
  ];
  const hints: Record<string, string[]> = {
    football: [
      'Uwzględnij: formę ostatnich 5 meczów, xG jeśli dostępne, skuteczność stałych fragmentów, pressing, kontuzje/rotacje.',
    ],
    basketball: [
      'Uwzględnij: offensive/defensive rating, tempo, skuteczność za 3, zbiórki, rotacje i kontuzje.',
    ],
    volleyball: [
      'Uwzględnij: efektywność ataku, blok, liczba błędów własnych, rotacje składu.',
    ],
    baseball: [
      'Uwzględnij: ERA/WHIP pitcherów, bullpen, splity home/away, wydajność ofensywy.',
    ],
    hockey: [
      'Uwzględnij: CF%/xGF% jeśli dostępne, special teams (PP/PK), forma bramkarza, fizyczność.',
    ],
  };
  return [...common, ...(hints[discipline] ?? [])].join('\n');
}

function parseMarkdownSections(md: string) {
  // Extremely simple parser to split into sections by headings
  const sections = { summary: '', details: '', recommendations: '' } as const;
  const result: Record<keyof typeof sections, string> = { ...sections } as any;
  let current: keyof typeof sections | null = null;
  md.split(/\r?\n/).forEach((line) => {
    const low = line.toLowerCase();
    if (low.includes('summary')) { current = 'summary'; return; }
    if (low.includes('details') || low.includes('szczeg')) { current = 'details'; return; }
    if (low.includes('recommendations') || low.includes('rekomend')) { current = 'recommendations'; return; }
    if (current) {
      result[current] += (result[current] ? '\n' : '') + line;
    }
  });
  return result;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const started = Date.now();
  const headers = new Headers({
    'Cache-Control': 'no-store',
  });

  try {
    const raw = await request.json();
    const { eventId, discipline, snapshot } = BodySchema.parse(raw);

    // Minimal completeness check (extend later per discipline)
    const hasTeams = snapshot?.teams?.home && snapshot?.teams?.away;
    const hasDate = Boolean(snapshot?.date || snapshot?.fixture?.date);
    if (!hasTeams || !hasDate) {
      // Log informational incident
      try {
        await locals.supabase?.from('logs').insert({
          event: 'analysis_generator',
          type: 'info',
          log: { tag: 'incomplete_data_for_analysis', eventId, discipline, fields: { hasTeams, hasDate } },
          created_at: new Date().toISOString(),
        } as any);
      } catch {}
      return new Response(JSON.stringify({
        error: 'Brak kompletnych danych do wygenerowania analizy.',
        code: 'INCOMPLETE_DATA',
      }), { status: 409, headers });
    }

    // Compute checksum of full snapshot
    const checksum = sha256Hex(jsonStableStringify(snapshot));

    // If an analysis with same checksum exists, return it (idempotency)
    try {
      const existingRes = await locals.supabase
        .from('analysis')
        .select('id, content_json, type, finished_at')
        .eq('event_id', eventId)
        .eq('checksum', checksum)
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const existing: any = (existingRes as any)?.data;
      const existingErr = (existingRes as any)?.error;
      if (!existingErr && existing) {
        return new Response(JSON.stringify({
          data: {
            analysisId: existing.id,
            summary: existing.content_json?.summary ?? '',
            details: existing.content_json?.details ?? '',
            recommendations: existing.content_json?.recommendations ?? '',
            type: existing.type ?? 'ai',
            finished_at: existing.finished_at,
          },
        }), { status: 200, headers });
      }
    } catch {}

    // Prepare timing but do NOT insert analysis yet
    const startedAt = new Date().toISOString();

    const prompt = buildPrompt(discipline, snapshot);
    // Debug: log prompt to server console (dev only)
    try { console.debug('[analysis] groq prompt:', prompt); } catch {}
    // Persist prompt (trimmed) to system logs for diagnostics (no FK coupling)
    try {
      await (locals as any)?.supabase?.from('logs').insert({
        event: 'analysis_generator',
        type: 'info',
        log: {
          tag: 'groq_prompt',
          prompt_len: String(prompt).length,
          prompt: String(prompt).slice(0, 4000),
          event_id: eventId,
        },
        created_at: new Date().toISOString(),
      } as any);
    } catch {}

    let md = '';
    let modelUsed = getGroqModel();
    try {
      const r = await callGroq(prompt);
      md = r.text;
      modelUsed = r.model;
    } catch (groqErr: any) {
      // classify error
      const msg = String(groqErr?.message || groqErr || 'unknown');
      const isAbort = groqErr?.name === 'AbortError' || /aborted|timeout/i.test(msg);
      const isMissingKey = groqErr?.code === 'MISSING_GROQ_API_KEY' || /MISSING_GROQ_API_KEY|not set/i.test(msg);
      const isHttp = /^Groq error:/i.test(msg);
      const code = isMissingKey
        ? 'MISSING_GROQ_API_KEY'
        : isAbort
        ? 'TIMEOUT'
        : isHttp
        ? 'HTTP_ERROR'
        : 'NETWORK_ERROR';
      const errorId = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

      // Log error to system logs (avoid FK to analysis that will be deleted)
      try {
        await (locals as any)?.supabase?.from('logs').insert({
          event: 'analysis_generator',
          type: 'error',
          log: { tag: 'groq_error', error: msg, code, isAbort, errorId, event_id: eventId },
          created_at: new Date().toISOString(),
        } as any);
      } catch {}
      const body = { error: 'Błąd generowania analizy. Spróbuj ponownie później.', code, errorId };
      return new Response(JSON.stringify(body), { status: isMissingKey ? 500 : 502, headers });
    }

    const sections = parseMarkdownSections(md);

    const finishedAt = new Date().toISOString();
    const duration = Date.now() - started;

    // Insert completed analysis (only after success)
    const insertCompleted = await locals.supabase
      .from('analysis')
      .insert({
        event_id: eventId,
        // legacy compatibility fields
        id_from_api: eventId as any,
        parameters: { discipline, snapshot } as any,
        type: 'ai',
        status: 'completed',
        checksum,
        started_at: startedAt,
        finished_at: finishedAt,
        duration_ms: duration,
        created_at: startedAt,
        content_json: {
          summary: sections.summary || md,
          details: sections.details || '',
          recommendations: sections.recommendations || '',
          model: modelUsed,
          md,
        },
      } as any)
      .select('id')
      .single();
    if ((insertCompleted as any).error) {
      // If saving analysis fails, at least log it and return error
      try {
        await (locals as any)?.supabase?.from('logs').insert({
          event: 'analysis_generator',
          type: 'error',
          log: { tag: 'save_completed_analysis_failed', error: String((insertCompleted as any).error?.message), event_id: eventId },
          created_at: new Date().toISOString(),
        } as any);
      } catch {}
      return new Response(JSON.stringify({ error: 'Błąd zapisu analizy.', code: 'DB_ERROR' }), { status: 500, headers });
    }
    const newId = (insertCompleted as any).data?.id as string;

    // Optional: log groq response received to analysis_logs now that we have analysis_id
    try {
      await locals.supabase?.from('analysis_logs').insert({
        analysis_id: newId,
        event_id: eventId,
        level: 'info',
        message: 'groq_response_received',
        context: { length: md.length },
        created_at: new Date().toISOString(),
      });
    } catch {}

    return new Response(JSON.stringify({
      data: {
        analysisId: newId,
        summary: sections.summary || md,
        details: sections.details || '',
        recommendations: sections.recommendations || '',
        type: 'ai',
        finished_at: finishedAt,
      },
    }), { status: 200, headers });
  } catch (err: any) {
    try {
      await (locals as any)?.supabase?.from('logs').insert({
        event: 'analysis_generator',
        type: 'error',
        log: { tag: 'analysis_generate_error', error: String(err?.message || err) },
        created_at: new Date().toISOString(),
      } as any);
    } catch {}
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera.' }), { status: 500, headers });
  }
};
