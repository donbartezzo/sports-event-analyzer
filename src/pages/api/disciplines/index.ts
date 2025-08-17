import type { APIRoute } from "astro";

export const prerender = false;

// Simple in-memory cache for disciplines list
interface Discipline {
  id: string;
  name: string;
  code: string;
}
interface CacheEntry {
  expiresAt: number;
  data: Discipline[];
}
let CACHE: CacheEntry | null = null;
const now = () => Date.now();

const DISCIPLINES: Discipline[] = [
  { id: "football", name: "Piłka nożna", code: "football" },
  { id: "basketball", name: "Koszykówka", code: "basketball" },
  { id: "volleyball", name: "Siatkówka", code: "volleyball" },
  { id: "baseball", name: "Baseball", code: "baseball" },
  { id: "hockey", name: "Hokej", code: "hockey" },
];

export const GET: APIRoute = async () => {
  const ttlMs = 24 * 60 * 60 * 1000; // 24h
  if (CACHE && CACHE.expiresAt > now()) {
    return new Response(JSON.stringify({ data: CACHE.data, meta: { source: "cache" } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        "x-cache": "HIT",
      },
    });
  }
  CACHE = { expiresAt: now() + ttlMs, data: DISCIPLINES };
  return new Response(JSON.stringify({ data: DISCIPLINES, meta: { source: "static" } }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
      "x-cache": "MISS",
    },
  });
};
