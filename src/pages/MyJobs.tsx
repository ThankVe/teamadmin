import { useMemo, useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEventsData } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { parseDateString } from '@/lib/dateUtils';
import { EventCard } from '@/components/events/EventCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Calendar, XCircle, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const months = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const MyJobs = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading } = useEventsData();

  const [myTeamMemberId, setMyTeamMemberId] = useState<string | null>(null);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const years = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - 3 + i);

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Fetch the current user's team_member_id
  useEffect(() => {
    const fetchTeamMemberId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setMyTeamMemberId(data.id);
    };
    fetchTeamMemberId();
  }, [user?.id]);

  // All events assigned to me
  const myEvents = useMemo(() => {
    if (!myTeamMemberId) return [];
    return events.filter(event =>
      event.photographers?.some(p => p.id === myTeamMemberId)
    );
  }, [events, myTeamMemberId]);

  // Events for selected month
  const monthlyEvents = useMemo(() => {
    return myEvents.filter(event => {
      const d = parseDateString(event.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [myEvents, selectedYear, selectedMonth]);

  const monthlyStats = useMemo(() => ({
    total: monthlyEvents.length,
    acknowledged: monthlyEvents.filter(e => e.status === 'acknowledged').length,
    in_progress: monthlyEvents.filter(e => e.status === 'in_progress').length,
    completed: monthlyEvents.filter(e => e.status === 'completed').length,
  }), [monthlyEvents]);

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
    status: event.status as 'acknowledged' | 'in_progress' | 'completed',
    createdAt: event.created_at,
    coverImage: event.cover_image_url,
  });

  // Upcoming & past (overall, not filtered by month)
  const { upcomingJobs, pastJobs } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = myEvents
      .filter(e => new Date(e.date) >= now && e.status !== 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const past = myEvents
      .filter(e => new Date(e.date) < now || e.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { upcomingJobs: upcoming, pastJobs: past };
  }, [myEvents]);

  if (authLoading || eventsLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
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
              <p className="text-muted-foreground">กรุณาเข้าสู่ระบบเพื่อดูงานของคุณ</p>
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

        {/* Monthly Workload Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
                สรุปงานรายเดือน
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <select
                  value={selectedMonth.toString()}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="h-8 w-32 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index.toString()}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear.toString()}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {years.map(year => (
                    <option key={year} value={year.toString()}>{year + 543}</option>
                  ))}
                </select>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-secondary">
                <p className="text-2xl font-bold text-foreground">{monthlyStats.total}</p>
                <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-600">{monthlyStats.acknowledged}</p>
                <p className="text-xs text-muted-foreground">รับทราบงาน</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-600">{monthlyStats.in_progress}</p>
                <p className="text-xs text-muted-foreground">ดำเนินงาน</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted">
                <p className="text-2xl font-bold text-muted-foreground">{monthlyStats.completed}</p>
                <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
              </div>
            </div>

            {/* Monthly event list */}
            {monthlyEvents.length > 0 && (
              <div className="mt-4 space-y-2">
                {monthlyEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {parseDateString(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} • {event.start_time} - {event.end_time}
                      </p>
                    </div>
                    <Badge variant={
                      event.status === 'in_progress' ? 'default' :
                      event.status === 'completed' ? 'outline' : 'secondary'
                    } className="text-xs">
                      {event.status === 'acknowledged' && 'รับทราบ'}
                      {event.status === 'in_progress' && 'ดำเนินงาน'}
                      {event.status === 'completed' && 'เสร็จสิ้น'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {monthlyEvents.length === 0 && (
              <div className="text-center py-6 text-muted-foreground mt-4">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">ไม่มีงานในเดือนนี้</p>
              </div>
            )}
          </CardContent>
        </Card>

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
