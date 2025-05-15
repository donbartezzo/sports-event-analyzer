import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import type { Event } from '../../types';
import { EventsList } from './EventsList';

interface EventsListWrapperProps {
  events: Event[];
}

export const EventsListWrapper = ({ events }: EventsListWrapperProps) => {
  return (
    <BrowserRouter>
      <EventsList events={events} />
    </BrowserRouter>
  );
};
