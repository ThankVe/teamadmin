import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventList } from '@/components/events/EventList';
import { useEventsData } from '@/hooks/useEvents';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import heroBanner from '@/assets/hero-banner.jpg';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { events, isLoading: eventsLoading } = useEventsData();
  const { settings, isLoading: settingsLoading } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && event.status !== 'cancelled';
      })
      .filter(event => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.activity_name.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, searchQuery]);

  const recentEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now || event.status === 'completed';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [events]);

  // Transform events to match EventCard expected format
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

  const bannerUrl = settings?.banner_url || heroBanner;

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="space-y-8 pb-8">
        {/* Hero Banner */}
        <section className="relative h-64 md:h-80 overflow-hidden">
          {settingsLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <>
              <img
                src={bannerUrl}
                alt="Hero Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                <div className="space-y-4 animate-slide-in-up">
                  <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
                    {settings?.site_name || 'ทีมโสตทัศนศึกษา'}
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                    {settings?.description || 'ระบบจัดการงานถ่ายภาพและวิดีโอ'}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Upcoming Events */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">กิจกรรมที่กำลังจะมาถึง</h2>
              <p className="text-muted-foreground mt-1">
                งานที่รอดำเนินการในอนาคต
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold">
              {upcomingEvents.length} งาน
            </span>
          </div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : (
            <EventList events={upcomingEvents.map(transformEvent)} />
          )}
        </section>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <section className="px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">งานล่าสุด</h2>
                <p className="text-muted-foreground mt-1">
                  งานที่ผ่านมาแล้ว
                </p>
              </div>
            </div>
            <EventList events={recentEvents.map(transformEvent)} />
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
