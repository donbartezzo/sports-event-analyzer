import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { Event } from '../../../types';

export const prerender = false;

const QuerySchema = z.object({
  league: z.string().min(1, 'league is required'),
  season: z.string().optional(),
  next: z
    .string()
    .transform((v) => (v ? Number(v) : undefined))
    .optional(),
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
    league: url.searchParams.get('league'),
    season: url.searchParams.get('season') ?? undefined,
    next: url.searchParams.get('next') ?? undefined,
  });

  if (!parse.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid query', details: parse.error.flatten() }),
      { status: 400 }
    );
  }

  const { league, season, next } = parse.data;

  const apiKey = import.meta.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: API_FOOTBALL_KEY missing' }),
      { status: 500 }
    );
  }

  const params = new URLSearchParams();
  params.set('league', league);
  params.set('next', String(next ?? 100));
  // Use current year as default season if not provided
  if (season) params.set('season', season);

  try {
    const resp = await fetch(`https://v3.football.api-sports.io/fixtures?${params.toString()}` , {
      headers: {
        'x-apisports-key': apiKey,
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(
        JSON.stringify({ error: 'Upstream error', status: resp.status, body: text }),
        { status: 502 }
      );
    }

    const json = await resp.json();
    const parsed = ApiFootballResponseSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Unexpected upstream payload', details: parsed.error.flatten() }),
        { status: 502 }
      );
    }

    const events: Event[] = parsed.data.response.map((r) => ({
      id: String(r.fixture.id),
      participantA: r.teams.home.name,
      participantB: r.teams.away.name,
      country: r.league.country ?? 'Unknown',
      league: r.league.name,
      startTime: r.fixture.date,
    }));

    return new Response(
      JSON.stringify({ data: events }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch events', message: String(err) }),
      { status: 503 }
    );
  }
};
