import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { League } from '../../../types';

export const prerender = false;

// Simple in-memory cache for upstream API-Football requests (leagues)
type CachedEntry = {
  expires: number;
  status: number;
  headers: [string, string][];
  body: string;
};
const UPSTREAM_CACHE = new Map<string, CachedEntry>();
const CACHE_TTL_MS = 300_000; // 5 minutes

const ApiFootballLeagueSchema = z.object({
  league: z.object({ id: z.number(), name: z.string(), type: z.string().optional() }),
  country: z.object({ name: z.string().nullable().optional() }).optional(),
  seasons: z.array(z.object({ year: z.number(), current: z.boolean().optional() })).optional(),
});

const ApiFootballResponseSchema = z.object({ response: z.array(ApiFootballLeagueSchema) });

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: API_FOOTBALL_KEY missing' }), { status: 500 });
  }

  const params = new URLSearchParams();
  params.set('current', 'true');

  try {
    const url = `https://v3.football.api-sports.io/leagues?${params.toString()}`;
    const key = url;
    const now = Date.now();
    const hit = UPSTREAM_CACHE.get(key);
    if (hit && hit.expires > now) {
      const h = new Headers(hit.headers);
      h.set('x-upstream-cache', 'HIT');
      const cachedResp = new Response(hit.body, { status: hit.status, headers: h });
      if (!cachedResp.ok) {
        const body = await cachedResp.text();
        return new Response(JSON.stringify({ error: 'Upstream error', status: cachedResp.status, body }), { status: 502 });
      }
      const json = await cachedResp.json();
      const parsed = ApiFootballResponseSchema.safeParse(json);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: 'Unexpected upstream payload', details: parsed.error.flatten() }),
          { status: 502 }
        );
      }
      // Filter: only type 'League' (exclude cups) and with current season
      const items = parsed.data.response.filter((r) => {
        const isLeague = (r.league.type ?? '').toLowerCase() === 'league';
        const hasCurrent = (r.seasons ?? []).some((s) => s.current === true);
        return isLeague && hasCurrent;
      });
      const WANTED = [
        { name: 'Premier League', country: 'England' },
        { name: 'Serie A', country: 'Italy' },
        { name: 'La Liga', country: 'Spain' },
        { name: 'Bundesliga', country: 'Germany' },
        { name: 'Ligue 1', country: 'France' },
        { name: 'Ekstraklasa', country: 'Poland' },
      ] as const;
      const normalized = items.map((r) => ({ id: r.league.id, name: r.league.name, country: r.country?.name ?? null }));
      const selected = WANTED
        .map((w) => normalized.find((n) => n.name.toLowerCase() === w.name.toLowerCase() && (n.country ?? '').toLowerCase() === w.country.toLowerCase()))
        .filter((x): x is NonNullable<typeof x> => Boolean(x));
      const leagues: League[] = selected as unknown as League[];
      return new Response(JSON.stringify({ data: leagues }), { status: 200, headers: { 'Content-Type': 'application/json', 'x-upstream-cache': 'HIT' } });
    }

    const resp = await fetch(url, { headers: { 'x-apisports-key': apiKey, Accept: 'application/json' } });
    if (!resp.ok) {
      const body = await resp.text();
      return new Response(JSON.stringify({ error: 'Upstream error', status: resp.status, body }), { status: 502 });
    }
    const headersArr = Array.from(resp.headers.entries());
    const text = await resp.text();
    // cache 200 OK
    UPSTREAM_CACHE.set(key, { expires: now + CACHE_TTL_MS, status: resp.status, headers: headersArr as [string, string][], body: text });
    const json = JSON.parse(text);
    const parsed = ApiFootballResponseSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Unexpected upstream payload', details: parsed.error.flatten() }),
        { status: 502 }
      );
    }

    // Filter: only type 'League' (exclude cups) and with current season
    const items = parsed.data.response.filter((r) => {
      const isLeague = (r.league.type ?? '').toLowerCase() === 'league';
      const hasCurrent = (r.seasons ?? []).some((s) => s.current === true);
      return isLeague && hasCurrent;
    });

    // Restrict to 6 specific leagues in a fixed order
    const WANTED = [
      { name: 'Premier League', country: 'England' },
      { name: 'Serie A', country: 'Italy' },
      { name: 'La Liga', country: 'Spain' },
      { name: 'Bundesliga', country: 'Germany' },
      { name: 'Ligue 1', country: 'France' },
      { name: 'Ekstraklasa', country: 'Poland' },
    ] as const;

    const normalized = items.map((r) => ({
      id: r.league.id,
      name: r.league.name,
      country: r.country?.name ?? null,
    }));

    const selected = WANTED
      .map((w) =>
        normalized.find(
          (n) => n.name.toLowerCase() === w.name.toLowerCase() && (n.country ?? '').toLowerCase() === w.country.toLowerCase()
        )
      )
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const leagues: League[] = selected as unknown as League[];

    return new Response(JSON.stringify({ data: leagues }), { status: 200, headers: { 'Content-Type': 'application/json', 'x-upstream-cache': 'MISS' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch leagues', message: String(e) }), { status: 503 });
  }
};
