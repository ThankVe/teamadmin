import { EventItem } from '@/types/event';
import { EventCard } from './EventCard';

interface EventListProps {
  events: EventItem[];
  onEventClick?: (event: EventItem) => void;
}

export const EventList = ({ events, onEventClick }: EventListProps) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="text-3xl">📅</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          ยังไม่มีกิจกรรม
        </h3>
        <p className="text-muted-foreground">
          กิจกรรมที่เพิ่มจะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => onEventClick?.(event)}
        />
      ))}
    </div>
  );
};
