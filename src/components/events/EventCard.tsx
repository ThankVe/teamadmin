 import { Calendar, Clock, MapPin, Users, Image as ImageIcon } from 'lucide-react';
 import { formatThaiDate } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { EventItem } from '@/types/event';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: EventItem;
  onClick?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  acknowledged: { label: 'รับทราบงาน', color: 'text-yellow-700', bgColor: 'bg-yellow-500' },
  pending: { label: 'รอดำเนินการ', color: 'text-yellow-700', bgColor: 'bg-yellow-500' },
  in_progress: { label: 'ดำเนินงาน', color: 'text-blue-700', bgColor: 'bg-blue-500' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'text-blue-700', bgColor: 'bg-blue-500' },
  completed: { label: 'เสร็จสิ้นงาน', color: 'text-green-700', bgColor: 'bg-green-500' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-700', bgColor: 'bg-red-500' },
};

const defaultStatus = { label: 'ไม่ระบุ', color: 'text-gray-700', bgColor: 'bg-gray-500' };

export const EventCard = ({ event, onClick }: EventCardProps) => {
  const navigate = useNavigate();
   const status = statusConfig[event.status] || defaultStatus;
   const formattedDate = formatThaiDate(event.date);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <Card 
      className={cn(
        'group cursor-pointer hover-lift overflow-hidden',
        'border-border/50 hover:border-primary/30',
        'bg-card hover:shadow-pink transition-all duration-300'
      )}
      onClick={handleClick}
    >
      {/* Cover Image */}
      <div className="h-36 relative overflow-hidden bg-muted">
        {event.coverImage ? (
          <img 
            src={event.coverImage} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Status Badge - Prominent position top-left */}
        <div className="absolute top-3 left-3">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg",
            "bg-white/95 backdrop-blur-sm border border-white/50"
          )}>
            <span className={cn("w-2.5 h-2.5 rounded-full", status.bgColor)} />
            <span className={cn("text-xs font-semibold", status.color)}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {event.activityName}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        {/* Photographers */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Users className="w-4 h-4 text-primary" />
          <div className="flex -space-x-2">
            {event.photographers.slice(0, 3).map((person, index) => (
              <Avatar key={person.id} className="w-7 h-7 border-2 border-card">
                <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                  {person.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {event.photographers.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground border-2 border-card">
                +{event.photographers.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-1">
            {event.photographers.length} คน
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
