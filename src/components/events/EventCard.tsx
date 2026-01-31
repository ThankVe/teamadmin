import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { EventItem } from '@/types/event';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: EventItem;
  onClick?: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  acknowledged: { label: 'รับทราบ', variant: 'secondary' },
  pending: { label: 'รอดำเนินการ', variant: 'secondary' },
  confirmed: { label: 'ยืนยันแล้ว', variant: 'default' },
  in_progress: { label: 'กำลังดำเนินงาน', variant: 'default' },
  completed: { label: 'เสร็จสิ้น', variant: 'outline' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
};

export const EventCard = ({ event, onClick }: EventCardProps) => {
  const status = statusConfig[event.status];
  const formattedDate = new Date(event.date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card 
      className={cn(
        'group cursor-pointer hover-lift overflow-hidden',
        'border-border/50 hover:border-primary/30',
        'bg-card hover:shadow-pink transition-all duration-300'
      )}
      onClick={onClick}
    >
      {/* Cover Image Placeholder */}
      <div className="h-32 gradient-soft relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="absolute bottom-3 right-3">
          <Badge variant={status.variant} className="shadow-sm">
            {status.label}
          </Badge>
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
