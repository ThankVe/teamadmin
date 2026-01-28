import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventList } from '@/components/events/EventList';
import { useEvents } from '@/contexts/EventContext';
import heroBanner from '@/assets/hero-banner.jpg';

const Index = () => {
  const { events, settings } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');

  const upcomingEvents = useMemo(() => {
    const now = new Date();
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
          event.activityName.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, searchQuery]);

  const recentEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now || event.status === 'completed';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [events]);

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="space-y-8 pb-8">
        {/* Hero Banner */}
        <section className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={heroBanner}
            alt="Hero Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/60" />
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div className="space-y-4 animate-slide-in-up">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground drop-shadow-lg">
                {settings.siteName}
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
                {settings.description || 'ระบบจัดการงานถ่ายภาพและวิดีโอ'}
              </p>
            </div>
          </div>
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
          <EventList events={upcomingEvents} />
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
            <EventList events={recentEvents} />
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
