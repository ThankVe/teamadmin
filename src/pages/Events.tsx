import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventList } from '@/components/events/EventList';
import { useEvents } from '@/contexts/EventContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusFilters = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'confirmed', label: 'ยืนยันแล้ว' },
  { value: 'completed', label: 'เสร็จสิ้น' },
  { value: 'cancelled', label: 'ยกเลิก' },
];

const Events = () => {
  const { events } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        if (statusFilter !== 'all' && event.status !== statusFilter) {
          return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            event.title.toLowerCase().includes(query) ||
            event.activityName.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, searchQuery, statusFilter]);

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">กิจกรรมทั้งหมด</h1>
            <p className="text-muted-foreground mt-1">
              รายการกิจกรรมและงานถ่ายทั้งหมด
            </p>
          </div>
          <Badge variant="secondary" className="self-start md:self-auto text-base px-4 py-2">
            รวม {events.length} กิจกรรม
          </Badge>
        </div>

        {/* Filters */}
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
        <EventList events={filteredEvents} />
      </div>
    </MainLayout>
  );
};

export default Events;
