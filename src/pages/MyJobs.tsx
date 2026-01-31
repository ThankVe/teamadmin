import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEventsData } from '@/hooks/useEvents';
import { EventCard } from '@/components/events/EventCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Calendar, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const MyJobs = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading } = useEventsData();

  // Find events assigned to the current user
  // We need to match by name since team_members might be linked via name
  const myEvents = useMemo(() => {
    if (!user?.email) return [];
    
    return events.filter(event => {
      // Check if user is in photographers list by matching name with email prefix
      const emailPrefix = user.email?.split('@')[0]?.toLowerCase() || '';
      const isAssigned = event.photographers?.some(
        p => p.name?.toLowerCase().includes(emailPrefix)
      );
      return isAssigned;
    });
  }, [events, user]);

  // Transform event for EventCard
  const transformEvent = (event: typeof events[0]) => ({
    id: event.id,
    title: event.title,
    activityName: event.activity_name,
    date: event.date,
    startTime: event.start_time,
    endTime: event.end_time,
    location: event.location,
    description: event.description,
    photographers: event.photographers || [],
    status: event.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    createdAt: event.created_at,
    coverImage: event.cover_image_url,
  });

  // Separate upcoming and past events
  const { upcomingJobs, pastJobs } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = myEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && event.status !== 'completed' && event.status !== 'cancelled';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const past = myEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate < now || event.status === 'completed';
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcomingJobs: upcoming, pastJobs: past };
  }, [myEvents]);

  if (authLoading || eventsLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
              <p className="text-muted-foreground">
                กรุณาเข้าสู่ระบบเพื่อดูงานของคุณ
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Camera className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              งานของฉัน
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              รายการงานที่คุณได้รับมอบหมาย
            </p>
          </div>
          <Badge variant="secondary" className="self-start sm:self-auto text-sm px-4 py-2">
            ทั้งหมด {myEvents.length} งาน
          </Badge>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{myEvents.filter(e => e.status === 'acknowledged' || e.status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">รับทราบงาน</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{myEvents.filter(e => e.status === 'in_progress' || e.status === 'confirmed').length}</p>
                  <p className="text-xs text-muted-foreground">ดำเนินงาน</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="text-2xl font-bold">{myEvents.filter(e => e.status === 'completed').length}</p>
                  <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{upcomingJobs.length}</p>
                  <p className="text-xs text-muted-foreground">งานที่รอ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Jobs */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            งานที่กำลังจะมาถึง
            <Badge variant="outline" className="ml-2">{upcomingJobs.length}</Badge>
          </h2>
          {upcomingJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>ไม่มีงานที่กำลังจะมาถึง</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingJobs.map(event => (
                <EventCard key={event.id} event={transformEvent(event)} />
              ))}
            </div>
          )}
        </section>

        {/* Past Jobs */}
        {pastJobs.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              งานที่ผ่านมา
              <Badge variant="outline" className="ml-2">{pastJobs.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastJobs.slice(0, 6).map(event => (
                <EventCard key={event.id} event={transformEvent(event)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default MyJobs;
