import React from 'react';
import type { Event } from '../../types';
import { EventsList } from './EventsList';

interface EventsListWrapperProps {
  events: Event[];
}

export const EventsListWrapper = ({ events }: EventsListWrapperProps) => {
  return (
    <EventsList events={events} />
  );
};
