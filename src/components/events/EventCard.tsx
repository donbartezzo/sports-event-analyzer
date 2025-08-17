import { Card, CardContent, CardHeader } from "../ui/card";
import type { Event } from "@/types";
import React from "react";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const [search, setSearch] = React.useState("");
  React.useEffect(() => {
    try {
      const s = typeof window !== "undefined" ? window.location.search : "";
      setSearch(s ?? "");
    } catch {
      setSearch("");
    }
  }, []);
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <a href={`/event/card/${event.id}${search}`}>
      <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {event.participantA} vs {event.participantB}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {event.country} - {event.league}
          </p>
          <p className="text-sm text-gray-500">{formatDate(event.startTime)}</p>
        </CardContent>
      </Card>
    </a>
  );
};
