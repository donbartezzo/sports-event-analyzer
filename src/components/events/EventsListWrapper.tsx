import React from 'react';
import type { Event } from '../../types';
import { EventsList } from './EventsList';

interface EventsListWrapperProps {
  events: Event[];
  discipline?: string;
}

export const EventsListWrapper = ({ events, discipline }: EventsListWrapperProps) => {
  return (
    <EventsList events={events} discipline={discipline} />
  );
};
