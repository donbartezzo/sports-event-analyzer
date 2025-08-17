/**
 * Generic API-Sports fetch helper for multiple sports.
 * Supports: football (v3), basketball, volleyball, baseball, hockey (v1).
 */
export type SupportedSport = 'football' | 'basketball' | 'volleyball' | 'baseball' | 'hockey';

type CachedEntry = {
  expires: number;
  status: number;
  headers: [string, string][];
  body: string;
};

const CACHE = new Map<string, CachedEntry>();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

import { API_FOOTBALL_BASE_URL } from './config';

const BASES: Record<SupportedSport, string> = {
  football: API_FOOTBALL_BASE_URL,
  basketball: 'https://v1.basketball.api-sports.io',
  volleyball: 'https://v1.volleyball.api-sports.io',
  baseball: 'https://v1.baseball.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
};

/**
 * Executes a fetch against the appropriate API-Sports base for the given sport.
 * Requires API_SPORTS_KEY to be set.
 */
export type ApiSportsFetchOptions = {
  ttlMs?: number; // cache TTL for GETs; set 0 to bypass cache
};

export async function apiSportsFetch(
  sport: SupportedSport,
  path: string,
  params: URLSearchParams,
  apiKey?: string,
  init?: RequestInit,
  opts: ApiSportsFetchOptions = {}
) {
  const base = BASES[sport];
  const url = `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}?${params.toString()}`;
  const key = apiKey ?? (import.meta as any).env.API_SPORTS_KEY;
  const headers: Record<string, string> = {};
  if (key) headers['x-apisports-key'] = key;

  const method = (init?.method || 'GET').toUpperCase();
  const useCache = method === 'GET' && opts.ttlMs !== 0;
  const ttl = typeof opts.ttlMs === 'number' ? opts.ttlMs : DEFAULT_TTL_MS;

  if (useCache) {
    const hit = CACHE.get(url);
    const now = Date.now();
    if (hit && hit.expires > now) {
      const h = new Headers(hit.headers);
      h.set('x-upstream-cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers: h });
    }
  }

  const resp = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string>),
      ...headers,
      Accept: 'application/json',
    },
  });

  if (!useCache) return resp;

  const status = resp.status;
  const headersArr = Array.from(resp.headers.entries());
  const body = await resp.text();

  if (status === 200) {
    CACHE.set(url, { expires: Date.now() + ttl, status, headers: headersArr as [string, string][], body });
  }

  const h = new Headers(headersArr);
  h.set('x-upstream-cache', 'MISS');
  return new Response(body, { status, headers: h });
}
