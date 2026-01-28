import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEvents } from '@/contexts/EventContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { getEventsByMonth, getEventsStats } from '@/data/mockData';

const months = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const Dashboard = () => {
  const { events, isAuthenticated } = useEvents();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Get events for selected month
  const monthlyEvents = useMemo(() => {
    return getEventsByMonth(events, selectedYear, selectedMonth);
  }, [events, selectedYear, selectedMonth]);

  const stats = useMemo(() => getEventsStats(monthlyEvents), [monthlyEvents]);
  const allStats = useMemo(() => getEventsStats(events), [events]);

  const statCards = [
    {
      title: 'งานทั้งหมด',
      value: stats.total,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'รอดำเนินการ',
      value: stats.pending,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'ยืนยันแล้ว',
      value: stats.confirmed,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'เสร็จสิ้น',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  // Generate years from current year
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i);

  // Available months (from current month onwards for current year)
  const availableMonths = useMemo(() => {
    if (selectedYear === currentYear) {
      return months.slice(currentMonth);
    }
    return months;
  }, [selectedYear, currentYear, currentMonth]);

  if (!isAuthenticated) {
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
                กรุณาเข้าสู่ระบบเพื่อดู Dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              ภาพรวมงานและกิจกรรม
            </p>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month, index) => {
                  const monthIndex = selectedYear === currentYear ? currentMonth + index : index;
                  return (
                    <SelectItem key={monthIndex} value={monthIndex.toString()}>
                      {month}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => {
                setSelectedYear(parseInt(v));
                if (parseInt(v) !== currentYear) {
                  setSelectedMonth(0);
                } else {
                  setSelectedMonth(currentMonth);
                }
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year + 543}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overall Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              สถิติรวมทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-secondary">
                <p className="text-3xl font-bold text-foreground">{allStats.total}</p>
                <p className="text-sm text-muted-foreground">งานทั้งหมด</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-warning/10">
                <p className="text-3xl font-bold text-warning">{allStats.pending}</p>
                <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-success/10">
                <p className="text-3xl font-bold text-success">{allStats.confirmed}</p>
                <p className="text-sm text-muted-foreground">ยืนยันแล้ว</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted">
                <p className="text-3xl font-bold text-muted-foreground">{allStats.completed}</p>
                <p className="text-sm text-muted-foreground">เสร็จสิ้น</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Events List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>งานในเดือน {months[selectedMonth]} {selectedYear + 543}</span>
              <Badge variant="secondary">{monthlyEvents.length} งาน</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>ไม่มีงานในเดือนนี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })} • {event.startTime} - {event.endTime}
                      </p>
                    </div>
                    <Badge variant={
                      event.status === 'confirmed' ? 'default' :
                      event.status === 'completed' ? 'outline' :
                      event.status === 'cancelled' ? 'destructive' : 'secondary'
                    }>
                      {event.status === 'pending' && 'รอดำเนินการ'}
                      {event.status === 'confirmed' && 'ยืนยันแล้ว'}
                      {event.status === 'completed' && 'เสร็จสิ้น'}
                      {event.status === 'cancelled' && 'ยกเลิก'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
