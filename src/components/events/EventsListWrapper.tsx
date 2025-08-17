import React from 'react';
import type { Event } from '../../types';
import { EventsList } from './EventsList';

interface EventsListWrapperProps {
  events: Event[];
  discipline?: string;
}

export const EventsListWrapper = ({ events, discipline }: EventsListWrapperProps) => {
  const [data, setData] = React.useState<Event[]>(events ?? []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If we already have SSR-provided events, do nothing
    if (data && data.length > 0) return;

    // Read parameters from the URL
    const url = new URL(window.location.href);
    const sport = (url.searchParams.get('sport') ?? '').toLowerCase();
    const league = url.searchParams.get('league') ?? '';
    if (!sport || !league) return;

    // Compute season consistent with SSR logic (football: Aug–May season; others: calendar year)
    const now = new Date();
    const season = sport === 'football'
      ? String(now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear())
      : String(now.getFullYear());

    const params = new URLSearchParams({ sport, league, season, next: '100' });
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/api/events?${params.toString()}`
          , { signal: controller.signal }
        );
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const json = await resp.json();
        setData(Array.isArray(json?.data) ? json.data : []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message ?? 'Nie udało się pobrać wydarzeń');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  // Run this effect only once after mount; changing sport/league triggers a full page reload anyway
  // (see navigation in list.astro)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EventsList events={data} isLoading={loading} error={error} discipline={discipline} />
  );
};
