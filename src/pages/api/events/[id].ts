import type { APIRoute } from 'astro';
import { z } from 'zod';
import { apiSportsFetch } from '../../../lib/api-sports';

export const prerender = false;

const ParamsSchema = z.object({
  id: z.string().min(1, 'id is required'),
  sport: z.string().optional(),
  league: z.string().optional(),
  season: z.string().optional(),
});

// Subset of API-Football fixture response we care about
const ApiFootballFixtureSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    status: z.object({ short: z.string().optional(), long: z.string().optional() }).optional(),
    venue: z.object({ name: z.string().nullable().optional() }).optional(),
  }),
  league: z.object({ name: z.string(), country: z.string().nullable().optional() }).optional(),
  teams: z.object({
    home: z.object({ name: z.string() }),
    away: z.object({ name: z.string() }),
  }),
});

const ApiFootballResponseSchema = z.object({ response: z.array(ApiFootballFixtureSchema) });

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  const parse = ParamsSchema.safeParse({
    id: params.id,
    sport: url.searchParams.get('sport') ?? undefined,
    league: url.searchParams.get('league') ?? undefined,
    season: url.searchParams.get('season') ?? undefined,
  });
  if (!parse.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid params', details: parse.error.flatten() }),
      { status: 400 }
    );
  }

  const sport = (parse.data.sport ?? 'football').toLowerCase();
  if (sport !== 'football') {
    return new Response(
      JSON.stringify({ error: 'Unsupported sport for event-by-id', sport }),
      { status: 400 }
    );
  }

  const apiKey = (import.meta as any).env.API_SPORTS_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: API_SPORTS_KEY missing' }),
      { status: 500 }
    );
  }

  try {
    let usedStrategy = 'by-id';
    // Strategy A: direct by-id
    const qp = new URLSearchParams();
    qp.set('id', parse.data.id);
    qp.set('timezone', 'UTC');

    // If season is provided (free plan/edge cases), include it
    if (parse.data.season) qp.set('season', parse.data.season);
    let resp = await apiSportsFetch('football', 'fixtures', qp, apiKey, { method: 'GET' }, { ttlMs: 0 });
    let text = await resp.text();
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: 'Upstream error', status: resp.status, body: text }),
        { status: 502 }
      );
    }

    let json: any = JSON.parse(text);
    let parsed = ApiFootballResponseSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid upstream shape', details: parsed.error.flatten() }),
        { status: 502 }
      );
    }

    let first = parsed.data.response[0];

    // Strategy A2: if empty, try a couple of seasons directly by id (inferred, previous, free-plan-default)
    if (!first) {
      usedStrategy = 'by-id-multi-season';
      const now = new Date();
      const inferredSeason = String(now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear());
      const prevSeason = String(Number(inferredSeason) - 1);
      const candidates = Array.from(new Set([
        parse.data.season,
        inferredSeason,
        prevSeason,
        '2023', // free plan default often allowed
      ].filter(Boolean)));

      for (const seasonTry of candidates) {
        if (first) break;
        try {
          const qp2 = new URLSearchParams();
          qp2.set('id', parse.data.id);
          qp2.set('timezone', 'UTC');
          qp2.set('season', String(seasonTry));
          const r2 = await apiSportsFetch('football', 'fixtures', qp2, apiKey, { method: 'GET' }, { ttlMs: 0 });
          const t2 = await r2.text();
          if (!r2.ok) continue;
          const j2: any = JSON.parse(t2);
          const p2 = ApiFootballResponseSchema.safeParse(j2);
          if (!p2.success) continue;
          first = p2.data.response[0];
        } catch {}
      }
    }

    // Strategy B: if empty and mamy league/season, użyj naszego listingu i odfiltruj po id
    if (!first && (parse.data.league || parse.data.season)) {
      try {
        const origin = `${url.protocol}//${url.host}`;
        const listUrl = new URL('/api/events', origin);
        if (parse.data.league) listUrl.searchParams.set('league', parse.data.league);
        if (parse.data.season) listUrl.searchParams.set('season', parse.data.season);
        listUrl.searchParams.set('sport', sport);
        listUrl.searchParams.set('next', '200');
        // użyj domyślnych strategii z list endpointu
        const listResp = await fetch(listUrl);
        if (listResp.ok) {
          const listJson = await listResp.json();
          const found = (listJson?.data ?? []).find((e: any) => String(e.id) === String(parse.data.id));
          if (found) {
            // Zmapuj do takiego samego kształtu jak first
            first = {
              fixture: { id: Number(found.id), date: found.startTime },
              league: { name: found.league, country: found.country },
              teams: { home: { name: found.participantA }, away: { name: found.participantB } },
            } as any;
            usedStrategy = 'list-fallback';
          }
        }
      } catch {}
    }

    if (!first) {
      return new Response(JSON.stringify({ data: null }), { status: 200 });
    }

    const data = {
      id: String(first.fixture.id),
      title: `${first.teams.home.name} vs ${first.teams.away.name}`,
      date: first.fixture.date,
      type: 'football',
      status: first.fixture.status?.long ?? 'scheduled',
      teams: {
        home: first.teams.home.name,
        away: first.teams.away.name,
      },
      venue: first.fixture.venue?.name ?? '',
      description: `${first.league?.name ?? ''}${first.league?.country ? ` (${first.league.country})` : ''}`.trim(),
    };

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'x-used-strategy': usedStrategy,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch event', message: String(err) }),
      { status: 503 }
    );
  }
};
