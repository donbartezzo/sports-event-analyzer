import type { APIRoute } from "astro";
import { z } from "zod";
import type { Event } from "../../../types";
import { apiSportsFetch } from "../../../lib/api-sports";
import { logger } from "@/lib/logger";

export const prerender = false;

// Simple 24h in-memory cache for events by key (sport+league+season+next)
interface EventsCacheEntry {
  expiresAt: number;
  payload: { data: Event[]; meta?: Record<string, unknown> };
}
const EVENTS_CACHE = new Map<string, EventsCacheEntry>();
const nowMs = () => Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

const QuerySchema = z.object({
  league: z.string().min(1, "league is required"),
  season: z.string().optional(),
  next: z
    .string()
    .transform((v) => (v ? Number(v) : undefined))
    .optional(),
  sport: z.string().optional(),
});

const ApiFootballFixtureSchema = z.object({
  fixture: z.object({ id: z.number(), date: z.string() }),
  league: z.object({ name: z.string(), country: z.string().optional() }),
  teams: z.object({
    home: z.object({ name: z.string() }),
    away: z.object({ name: z.string() }),
  }),
});

const ApiFootballResponseSchema = z.object({
  response: z.array(ApiFootballFixtureSchema),
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse({
    league: url.searchParams.get("league"),
    season: url.searchParams.get("season") ?? undefined,
    next: url.searchParams.get("next") ?? undefined,
    sport: url.searchParams.get("sport") ?? undefined,
  });

  if (!parse.success) {
    return new Response(JSON.stringify({ error: "Invalid query", details: parse.error.flatten() }), { status: 400 });
  }

  const { league, season, next } = parse.data;
  const sport = (parse.data.sport ?? "football").toLowerCase();
  const SUPPORTED = new Set(["football", "basketball", "volleyball", "baseball", "hockey"]);
  if (!SUPPORTED.has(sport)) {
    return new Response(JSON.stringify({ error: "Invalid sport", allowed: Array.from(SUPPORTED) }), { status: 400 });
  }

  // Compose cache key and try cache first
  const cacheKey = `${sport}|${league}|${season ?? ""}|${next ?? ""}`;
  const hit = EVENTS_CACHE.get(cacheKey);
  if (hit && hit.expiresAt > nowMs()) {
    return new Response(JSON.stringify(hit.payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        "x-cache": "HIT",
      },
    });
  }

  // For now only football is implemented; other sports return an empty placeholder response.
  if (sport !== "football") {
    const payload = { data: [], meta: { sport, note: "This sport is not implemented yet" } };
    // store 24h in-memory cache
    EVENTS_CACHE.set(cacheKey, { expiresAt: nowMs() + DAY_MS, payload });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        "x-cache": "MISS",
      },
    });
  }

  const apiKey = (import.meta as unknown as { env: { API_SPORTS_KEY?: string } }).env.API_SPORTS_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: API_SPORTS_KEY missing (required for football fixtures)" }),
      { status: 500 }
    );
  }

  const params = new URLSearchParams();
  params.set("league", league);
  // Use current season start year by default (football-specific season logic often spans Aug–May)
  const now = new Date();
  const inferredSeasonYear = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
  const currentYear = inferredSeasonYear.toString();
  // Optimize for free plan: default to 2023 if no season provided
  const FREE_PLAN_DEFAULT_SEASON = "2023";
  const chosenSeason = season ?? FREE_PLAN_DEFAULT_SEASON;
  const prevSeason = String(Number(chosenSeason) - 1);
  // We'll only apply season for strategies that need it; window search will omit season
  // Prefer explicit date window to ensure results
  const to = new Date(now);
  to.setDate(now.getDate() + 30); // next 30 days
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const windowParams = new URLSearchParams();
  windowParams.set("league", league);
  windowParams.set("from", fmt(now));
  windowParams.set("to", fmt(to));
  windowParams.set("timezone", "UTC");

  try {
    // Unified fetch with caching & base URL from config
    const doFetch = async (search: URLSearchParams) => apiSportsFetch("football", "fixtures", search, apiKey);

    const p1 = new URLSearchParams();
    p1.set("league", league);
    p1.set("season", chosenSeason);
    p1.set("next", String(next ?? 20));
    p1.set("timezone", "UTC");
    let resp = await doFetch(p1);
    let usedStrategy = "next-with-season";
    let usedQuery: string = p1.toString();

    if (resp.status === 429) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: "Rate limited", status: resp.status, body: text }), { status: 429 });
    }

    const tryParse = async (r: Response) => {
      if (!r.ok) {
        const text = await r.text();
        return { ok: false as const, status: r.status, body: text };
      }
      const json = await r.json();
      const parsed = ApiFootballResponseSchema.safeParse(json);
      if (!parsed.success) {
        return { ok: false as const, status: 502, body: parsed.error.flatten(), raw: json };
      }
      // Also surface upstream diagnostics when empty
      return { ok: true as const, data: parsed.data.response, raw: json };
    };

    let parsed = await tryParse(resp);

    // Strategy 0: league + season only (broad pull for the season)
    if (parsed.ok && parsed.data.length === 0) {
      const p0 = new URLSearchParams();
      p0.set("league", league);
      p0.set("season", chosenSeason);
      p0.set("timezone", "UTC");
      resp = await doFetch(p0);
      usedStrategy = "league-season-only";
      usedQuery = p0.toString();
      parsed = await tryParse(resp);
    }

    // Removed: `next` without season (free plan requires season)

    // Strategy 3: date window WITH season
    if (parsed.ok && parsed.data.length === 0) {
      const wSeason = new URLSearchParams(windowParams);
      wSeason.set("season", chosenSeason);
      resp = await doFetch(wSeason);
      usedStrategy = "window-with-season";
      usedQuery = wSeason.toString();
      parsed = await tryParse(resp);
    }

    // Removed: window without season (free plan requires season)

    // Strategy 5: single date = today (WITH season)
    if (parsed.ok && parsed.data.length === 0) {
      const d1 = new URLSearchParams();
      d1.set("league", league);
      d1.set("season", chosenSeason);
      d1.set("date", fmt(now));
      d1.set("timezone", "UTC");
      resp = await doFetch(d1);
      usedStrategy = "date-today";
      usedQuery = d1.toString();
      parsed = await tryParse(resp);
    }

    // Strategy 6: single date = tomorrow (WITH season)
    if (parsed.ok && parsed.data.length === 0) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const d2 = new URLSearchParams();
      d2.set("league", league);
      d2.set("season", chosenSeason);
      d2.set("date", fmt(tomorrow));
      d2.set("timezone", "UTC");
      resp = await doFetch(d2);
      usedStrategy = "date-tomorrow";
      usedQuery = d2.toString();
      parsed = await tryParse(resp);
    }

    // Strategy 7: week window (from today to +7 days) WITH season
    if (parsed.ok && parsed.data.length === 0) {
      const week = new URLSearchParams();
      const to7 = new Date(now);
      to7.setDate(now.getDate() + 7);
      week.set("league", league);
      week.set("season", chosenSeason);
      week.set("from", fmt(now));
      week.set("to", fmt(to7));
      week.set("timezone", "UTC");
      resp = await doFetch(week);
      usedStrategy = "window-7d-with-season";
      usedQuery = week.toString();
      parsed = await tryParse(resp);
    }

    // Strategy 8: `next` with previous season (covers season boundary around Jul/Aug)
    if (parsed.ok && parsed.data.length === 0) {
      const pPrev = new URLSearchParams();
      pPrev.set("league", league);
      pPrev.set("season", prevSeason);
      pPrev.set("next", String(next ?? 20));
      pPrev.set("timezone", "UTC");
      resp = await doFetch(pPrev);
      usedStrategy = "next-with-prev-season";
      usedQuery = pPrev.toString();
      parsed = await tryParse(resp);
    }

    // Strategy 9: week window WITH previous season
    if (parsed.ok && parsed.data.length === 0) {
      const wPrev = new URLSearchParams();
      const to7b = new Date(now);
      to7b.setDate(now.getDate() + 7);
      wPrev.set("league", league);
      wPrev.set("season", prevSeason);
      wPrev.set("from", fmt(now));
      wPrev.set("to", fmt(to7b));
      wPrev.set("timezone", "UTC");
      resp = await doFetch(wPrev);
      usedStrategy = "window-7d-with-prev-season";
      usedQuery = wPrev.toString();
      parsed = await tryParse(resp);
    }

    // Strategy 10: Free plan fallback to allowed season (2023) full-season window
    if (parsed.ok && parsed.data.length === 0) {
      const raw = (parsed as { raw?: unknown }).raw;
      const errors =
        raw && typeof raw === "object" && raw !== null && "errors" in (raw as Record<string, unknown>)
          ? ((raw as { errors?: Record<string, unknown> }).errors ?? undefined)
          : undefined;
      const planVal = errors && typeof errors.plan === "string" ? (errors.plan as string) : undefined;
      const seasonVal = errors && typeof errors.season === "string" ? (errors.season as string) : undefined;
      const mentionsFreePlan = planVal?.toLowerCase().includes("free plans") ?? false;
      const mentionsSeasonRequired = seasonVal?.toLowerCase().includes("required") ?? false;
      if (mentionsFreePlan || mentionsSeasonRequired) {
        const FALLBACK_SEASON = "2023";
        const fs = new URLSearchParams();
        fs.set("league", league);
        fs.set("season", FALLBACK_SEASON);
        fs.set("from", "2023-07-01");
        fs.set("to", "2024-06-30");
        fs.set("timezone", "UTC");
        resp = await doFetch(fs);
        usedStrategy = "free-plan-fallback-2023";
        usedQuery = fs.toString();
        parsed = await tryParse(resp);
      }
    }

    if (!parsed.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream error", status: parsed.status, body: parsed.body, strategy: usedStrategy }),
        { status: 502 }
      );
    }

    const events: Event[] = parsed.data.map((r) => ({
      id: String(r.fixture.id),
      participantA: r.teams.home.name,
      participantB: r.teams.away.name,
      country: r.league.country ?? "Unknown",
      league: r.league.name,
      startTime: r.fixture.date,
    }));

    // Debug: log upstream result size and strategy (visible in server console)
    try {
      const rlRem = resp.headers.get("x-ratelimit-remaining");
      const rlDay = resp.headers.get("x-ratelimit-requests-remaining");
      logger.info("[api/events] fetch summary", {
        league,
        season: season ?? currentYear,
        strategy: usedStrategy,
        count: events.length,
        query: usedQuery,
        rlRem: String(rlRem),
        rlDay: String(rlDay),
      });
    } catch {
      // ignore: console logging may be unavailable
    }

    const payload = {
      data: events,
      meta: {
        strategy: usedStrategy,
        count: events.length,
        query: usedQuery,
        upstream: parsed.raw?.results ?? undefined,
        errors: parsed.raw?.errors ?? undefined,
        paging: parsed.raw?.paging ?? undefined,
      },
    };
    // store 24h in-memory cache
    EVENTS_CACHE.set(cacheKey, { expiresAt: nowMs() + DAY_MS, payload });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        "x-used-strategy": usedStrategy,
        "x-count": String(events.length),
        "x-query": usedQuery,
        "x-cache": "MISS",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch events", message: String(err) }), { status: 503 });
  }
};
