import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventList } from '@/components/events/EventList';
import { useEventsData } from '@/hooks/useEvents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusFilters = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'acknowledged', label: 'รับทราบงาน' },
  { value: 'in_progress', label: 'ดำเนินงาน' },
  { value: 'completed', label: 'เสร็จสิ้นงาน' },
];

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const Events = () => {
  const { events, isLoading } = useEventsData();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');

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

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        if (eventDate.getMonth() !== selectedMonth || eventDate.getFullYear() !== selectedYear) return false;
        if (statusFilter !== 'all' && event.status !== statusFilter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            event.title.toLowerCase().includes(query) ||
            event.activity_name.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, searchQuery, statusFilter, selectedMonth, selectedYear]);

  const transformedEvents = filteredEvents.map(event => ({
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
  }));

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">กิจกรรมทั้งหมด</h1>
            <p className="text-muted-foreground mt-1">รายการกิจกรรมและงานถ่ายทั้งหมด</p>
          </div>
          <Badge variant="secondary" className="self-start md:self-auto text-base px-4 py-2">
            รวม {filteredEvents.length} กิจกรรม
          </Badge>
        </div>

        {/* Month/Year Filter */}
        <div className="flex flex-wrap items-center gap-2">
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
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'rounded-full',
                statusFilter === filter.value && 'gradient-pink text-primary-foreground'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Event List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <EventList events={transformedEvents} />
        )}
      </div>
    </MainLayout>
  );
};

export default Events;
