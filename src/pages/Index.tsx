import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventList } from '@/components/events/EventList';
import { useEventsData } from '@/hooks/useEvents';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import heroBanner from '@/assets/hero-banner.jpg';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const Index = () => {
  const { events, isLoading: eventsLoading } = useEventsData();
  const { settings, isLoading: settingsLoading } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - 3 + i);
  }, []);

  const navigateMonth = (dir: number) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        if (eventDate.getMonth() !== selectedMonth || eventDate.getFullYear() !== selectedYear) return false;
        if (event.status === 'cancelled') return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.activity_name.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, searchQuery, selectedMonth, selectedYear]);

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

  const bannerUrl = settings?.banner_url || heroBanner;
  const showBannerText = settings?.show_banner_text !== false;

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="space-y-8 pb-8">
        {/* Hero Banner */}
        <section className="relative w-full h-screen -mt-4 overflow-hidden">
          {settingsLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <>
              <img src={bannerUrl} alt="Hero Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
              {showBannerText && (
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
              )}
            </>
          )}
        </section>

        {/* Events by Month */}
        <section className="px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">กิจกรรม</h2>
              <p className="text-muted-foreground mt-1">แสดงงานตามเดือน</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {thaiMonths.map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y + 543}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold whitespace-nowrap">
                {filteredEvents.length} งาน
              </span>
            </div>
          </div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : (
            <EventList events={filteredEvents.map(transformEvent)} />
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
