// Centralized configuration for server-side libs
// Base URL for API-Sports football endpoint; can be overridden via env (server-side only)
export const API_FOOTBALL_BASE_URL =
  (import.meta.env.API_FOOTBALL_BASE_URL as string) || "https://v3.football.api-sports.io";
