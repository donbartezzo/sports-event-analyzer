import type { APIRoute } from "astro";
import { z } from "zod";
import type { League } from "../../../types";
import { apiSportsFetch, type SupportedSport } from "../../../lib/api-sports";

export const prerender = false;

// Simple in-memory cache per sport
interface CacheEntry {
  expiresAt: number;
  payload: { data: League[]; meta?: Record<string, unknown> };
}
const CACHE = new Map<string, CacheEntry>();
const now = () => Date.now();

const ApiFootballLeagueSchema = z.object({
  league: z.object({ id: z.number(), name: z.string(), type: z.string().optional() }),
  country: z.object({ name: z.string().nullable().optional() }).optional(),
  seasons: z.array(z.object({ year: z.number(), current: z.boolean().optional() })).optional(),
});

const ApiFootballResponseSchema = z.object({ response: z.array(ApiFootballLeagueSchema) });

// Generic API-Sports schema (accept common variants and string ids)
const ApiSportsLeagueNested = z.object({
  league: z.object({ id: z.union([z.number(), z.string()]), name: z.string(), type: z.string().optional() }),
  country: z.object({ name: z.string().nullable().optional() }).optional(),
});
const ApiSportsLeagueFlat = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  country: z
    .union([z.string(), z.object({ name: z.string().nullable().optional() })])
    .nullable()
    .optional(),
  type: z.string().optional(),
});
const ApiSportsResponseSchema = z.object({ response: z.array(z.union([ApiSportsLeagueNested, ApiSportsLeagueFlat])) });

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const sport = (url.searchParams.get("sport") ?? "football").toLowerCase();
  const SUPPORTED = new Set(["football", "basketball", "volleyball", "baseball", "hockey"]);
  if (!SUPPORTED.has(sport)) {
    return new Response(JSON.stringify({ error: "Invalid sport", allowed: Array.from(SUPPORTED) }), { status: 400 });
  }

  // Cache lookup (with guard against stale presets for other sports)
  const cached = CACHE.get(sport);
  if (cached && cached.expiresAt > now()) {
    const meta = cached.payload.meta;
    const isPreset = !!(meta && typeof meta === "object" && (meta as Record<string, unknown>).source === "preset");
    const hasData = Array.isArray(cached.payload.data) && cached.payload.data.length > 0;
    // If sport is not 'football' and previously cached preset or any non-empty data, invalidate to reflect new behavior
    if (sport !== "football" && (isPreset || hasData)) {
      CACHE.delete(sport);
    } else {
      return new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // 24h cache for responses served from memory as well
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
          "x-cache": "HIT",
        },
      });
    }
  }

  // Handle other sports via API-Sports
  if (sport !== "football") {
    const apiKey = (import.meta as unknown as { env: { API_SPORTS_KEY?: string } }).env.API_SPORTS_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: API_SPORTS_KEY missing (required for other sports)" }),
        { status: 500 }
      );
    }
    const params = new URLSearchParams();
    try {
      const resp = await apiSportsFetch(sport as SupportedSport, "leagues", params, apiKey);
      if (!resp.ok) {
        const body = await resp.text();
        return new Response(JSON.stringify({ error: "Upstream error", upstreamStatus: resp.status, body }), {
          status: resp.status,
        });
      }
      const json: unknown = await resp.json();
      const arr: unknown[] = Array.isArray((json as { response?: unknown[] } | null)?.response)
        ? ((json as { response: unknown[] }).response as unknown[])
        : [];
      if (
        !arr.length &&
        (json as { errors?: unknown[] } | null)?.errors &&
        Array.isArray((json as { errors?: unknown[] }).errors) &&
        (json as { errors: unknown[] }).errors!.length
      ) {
        // Upstream returned explicit errors
        return new Response(JSON.stringify({ error: "Upstream error payload", upstreamRaw: json }), { status: 502 });
      }
      const leagues: League[] = arr
        .map((r) => {
          if (
            r &&
            typeof r === "object" &&
            "league" in (r as Record<string, unknown>) &&
            (r as Record<string, unknown>).league
          ) {
            const l = (r as { league: unknown }).league as Record<string, unknown>;
            const type = String((l?.type as string | undefined) ?? "").toLowerCase();
            if (type && type !== "league") return null;
            const idVal = l?.id as string | number | undefined;
            const idNum = typeof idVal === "string" ? Number(idVal) : Number(idVal);
            if (!Number.isFinite(idNum)) return null;
            return {
              id: idNum,
              name: String((l?.name as string | undefined) ?? "").trim(),
              country: (r as { country?: { name?: string | null } | null | undefined })?.country?.name ?? null,
            } as League;
          }
          // flat variant
          const type = String(((r as Record<string, unknown>)?.type as string | undefined) ?? "").toLowerCase();
          if (type && type !== "league") return null;
          const idVal = (r as Record<string, unknown>)?.id as string | number | undefined;
          const idNum = typeof idVal === "string" ? Number(idVal) : Number(idVal);
          if (!Number.isFinite(idNum)) return null;
          const countryVal = (r as Record<string, unknown>)?.country as unknown;
          const countryName =
            typeof countryVal === "string"
              ? countryVal || null
              : ((countryVal as { name?: string | null } | null | undefined)?.name ?? null);
          return {
            id: idNum,
            name: String(((r as Record<string, unknown>)?.name as string | undefined) ?? "").trim(),
            country: countryName,
          } as League;
        })
        .filter((x): x is League => !!x && !!x.name);
      const payload = { data: leagues, meta: { sport } };
      // Cache other sports leagues for 24 hours
      CACHE.set(sport, { expiresAt: now() + 24 * 60 * 60 * 1000, payload });
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
          "x-cache": "MISS",
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Failed to fetch leagues" }), { status: 503 });
    }
  }
  const apiKey = (import.meta.env as { API_SPORTS_KEY?: string }).API_SPORTS_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: API_SPORTS_KEY missing (required for football)" }),
      { status: 500 }
    );
  }

  const params = new URLSearchParams();
  params.set("current", "true");

  try {
    const resp = await apiSportsFetch("football", "leagues", params, apiKey);
    if (!resp.ok) {
      const body = await resp.text();
      return new Response(JSON.stringify({ error: "Upstream error", status: resp.status, body }), { status: 502 });
    }
    const json = await resp.json();
    const parsed = ApiFootballResponseSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Unexpected upstream payload", details: parsed.error.flatten() }), {
        status: 502,
      });
    }

    // Filter: only type 'League' (exclude cups) and with current season
    const items = parsed.data.response.filter((r) => {
      const isLeague = (r.league.type ?? "").toLowerCase() === "league";
      const hasCurrent = (r.seasons ?? []).some((s) => s.current === true);
      return isLeague && hasCurrent;
    });

    // Restrict to 6 specific leagues in a fixed order
    const WANTED = [
      { name: "Premier League", country: "England" },
      { name: "Serie A", country: "Italy" },
      { name: "La Liga", country: "Spain" },
      { name: "Bundesliga", country: "Germany" },
      { name: "Ligue 1", country: "France" },
      { name: "Ekstraklasa", country: "Poland" },
    ] as const;

    const normalized = items.map((r) => ({
      id: r.league.id,
      name: r.league.name,
      country: r.country?.name ?? null,
    }));

    let selected = WANTED.map((w) =>
      normalized.find(
        (n) =>
          n.name.toLowerCase() === w.name.toLowerCase() && (n.country ?? "").toLowerCase() === w.country.toLowerCase()
      )
    ).filter((x): x is NonNullable<typeof x> => Boolean(x));

    // Fallback: if WANTED matching failed or returned too few, use first 30 normalized leagues
    if (!selected || selected.length < 3) {
      selected = normalized.slice(0, 30);
    }

    const leagues: League[] = selected as unknown as League[];

    // Preserve x-upstream-cache from the upstream helper if present
    const cacheHeader = resp.headers.get("x-upstream-cache") ?? undefined;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cacheHeader) headers["x-upstream-cache"] = cacheHeader;
    const payload = { data: leagues, meta: { sport } };
    // Cache football leagues for 24 hours
    CACHE.set(sport, { expiresAt: now() + 24 * 60 * 60 * 1000, payload });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...headers,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        "x-cache": "MISS",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch leagues" }), { status: 503 });
  }
};
