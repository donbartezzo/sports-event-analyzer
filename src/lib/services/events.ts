import type { Event } from '../../types';

export type GetEventsParams = {
  league: string;
  season?: string;
  next?: number;
};

export async function getEvents(params: GetEventsParams): Promise<Event[]> {
  const url = new URL('/api/events', window.location.origin);
  url.searchParams.set('league', params.league);
  if (params.season) url.searchParams.set('season', params.season);
  if (params.next) url.searchParams.set('next', String(params.next));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status}`);
  }
  const json = await res.json();
  return json.data as Event[];
}
