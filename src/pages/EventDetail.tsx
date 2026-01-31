import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEventsData } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, 
  Package, Camera, FileText, Image as ImageIcon 
} from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  acknowledged: { label: 'รับทราบ', variant: 'secondary' },
  pending: { label: 'รอดำเนินการ', variant: 'secondary' },
  confirmed: { label: 'ยืนยันแล้ว', variant: 'default' },
  in_progress: { label: 'กำลังดำเนินงาน', variant: 'default' },
  completed: { label: 'เสร็จสิ้น', variant: 'outline' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, isLoading } = useEventsData();

  const event = events.find(e => e.id === id);
  const status = event ? (statusConfig[event.status] || { label: 'ไม่ระบุ', variant: 'secondary' as const }) : null;

  const formattedDate = event ? new Date(event.date).toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">ไม่พบกิจกรรม</h1>
          <p className="text-muted-foreground mt-2">กิจกรรมที่คุณต้องการดูไม่มีอยู่ในระบบ</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับหน้าแรก
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pb-8">
        {/* Cover Image */}
        <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <ImageIcon className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-background/80 hover:bg-background"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Status Badge */}
          {status && (
            <div className="absolute bottom-4 right-4">
              <Badge variant={status.variant} className="text-sm px-3 py-1">
                {status.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 -mt-8 relative z-10">
          <div className="bg-card rounded-xl shadow-lg p-6 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {event.title}
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                {event.activity_name}
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">วันที่</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">เวลา</p>
                  <p className="font-medium">{event.start_time} - {event.end_time}</p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 md:col-span-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">สถานที่</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Team Members */}
            {event.photographers && event.photographers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-primary" />
                  ทีมงานที่รับผิดชอบ ({event.photographers.length} คน)
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.photographers.map((person) => (
                    <div key={person.id} className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {person.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{person.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {event.equipment && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Package className="w-4 h-4 text-primary" />
                  อุปกรณ์ที่ต้องนำไป
                </div>
                <p className="text-muted-foreground whitespace-pre-line pl-6">
                  {event.equipment}
                </p>
              </div>
            )}

            {/* Shooting Focus */}
            {event.shooting_focus && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Camera className="w-4 h-4 text-primary" />
                  รายละเอียดงาน (สิ่งที่ต้องเน้น)
                </div>
                <p className="text-muted-foreground whitespace-pre-line pl-6">
                  {event.shooting_focus}
                </p>
              </div>
            )}

            {/* Additional Details */}
            {event.additional_details && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-primary" />
                  รายละเอียดเพิ่มเติม
                </div>
                <p className="text-muted-foreground whitespace-pre-line pl-6">
                  {event.additional_details}
                </p>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">หมายเหตุ</p>
                <p className="text-muted-foreground whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetail;
