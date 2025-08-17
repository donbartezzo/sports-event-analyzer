import React from "react";
import type { Event } from "../../types";
import { EventCard } from "./EventCard";

interface EventsListProps {
  events: Event[];
  isLoading?: boolean;
  error?: string | null;
  discipline?: string;
}

export const EventsList = ({ events, isLoading = false, error = null, discipline }: EventsListProps) => {
  if (isLoading) {
    return (
      <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
        <svg
          className="h-10 w-10 animate-spin text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <h4 className="text-sm font-medium">Loading…</h4>
        <p className="text-xs">Fetching upcoming events for the selected filters.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
        <svg
          className="h-10 w-10 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21 20l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <h4 className="text-sm font-medium">No events found</h4>
        <p className="text-xs">Try changing the league or check back later.</p>
      </div>
    );
  }

  return (
    <div>
      {discipline ? <div className="mb-2 text-sm text-muted-foreground">Discipline: {discipline}</div> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};
