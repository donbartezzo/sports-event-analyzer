import React from 'react';
import type { Event } from '../../types';
import { EventCard } from './EventCard';

interface EventsListProps {
  events: Event[];
  isLoading?: boolean;
  error?: string | null;
  discipline?: string;
}

export const EventsList = ({ events, isLoading = false, error = null, discipline }: EventsListProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
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
      <div className="text-center text-gray-500">
        <p>No events found</p>
      </div>
    );
  }

  return (
    <div>
      {discipline ? (
        <div className="mb-2 text-sm text-muted-foreground">Discipline: {discipline}</div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
          />
        ))}
      </div>
    </div>
  );
};
