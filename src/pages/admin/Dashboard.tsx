import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
 import { formatThaiDateShort, parseDateString } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useEventsData } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, XCircle, TrendingUp, Camera, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ExportDialog } from '@/components/dashboard/ExportDialog';

const months = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const Dashboard = () => {
  const { user, canManageEvents, isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading } = useEventsData();
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Get events for selected month
  const monthlyEvents = useMemo(() => {
    return events.filter(event => {
       const eventDate = parseDateString(event.date);
      return eventDate.getFullYear() === selectedYear && eventDate.getMonth() === selectedMonth;
    });
  }, [events, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    const total = monthlyEvents.length;
    const acknowledged = monthlyEvents.filter(e => e.status === 'acknowledged').length;
    const in_progress = monthlyEvents.filter(e => e.status === 'in_progress').length;
    const completed = monthlyEvents.filter(e => e.status === 'completed').length;
    return { total, acknowledged, in_progress, completed };
  }, [monthlyEvents]);

  const allStats = useMemo(() => {
    const total = events.length;
    const acknowledged = events.filter(e => e.status === 'acknowledged').length;
    const in_progress = events.filter(e => e.status === 'in_progress').length;
    const completed = events.filter(e => e.status === 'completed').length;
    return { total, acknowledged, in_progress, completed };
  }, [events]);

  // Generate monthly chart data for selected year
  const monthlyChartData = useMemo(() => {
    return months.map((monthName, index) => {
      const count = events.filter(event => {
         const eventDate = parseDateString(event.date);
        return eventDate.getFullYear() === selectedYear && eventDate.getMonth() === index;
      }).length;
      
      return {
        month: monthName.slice(0, 3), // Short month name
        fullMonth: monthName,
        count,
        isSelected: index === selectedMonth,
      };
    });
  }, [events, selectedYear, selectedMonth]);

  const statCards = [
    {
      title: 'งานทั้งหมด',
      value: stats.total,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'รับทราบงาน',
      value: stats.acknowledged,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'ดำเนินงาน',
      value: stats.in_progress,
      icon: Camera,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'เสร็จสิ้น',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  // Generate years (3 years back + 2 forward)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  // All months available regardless of year
  const availableMonths = months;

  if (authLoading || eventsLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !canManageEvents) {
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

          {/* Month Filter & Export */}
          <div className="flex items-center gap-3">
            <ExportDialog
              events={monthlyEvents}
              stats={stats}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              months={months}
            />
            
            <select
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="h-10 w-36 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {availableMonths.map((month, index) => (
                <option key={index} value={index.toString()}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear.toString()}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                setSelectedYear(year);
              }}
              className="h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year + 543}
                </option>
              ))}
            </select>
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

        {/* Monthly Events Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              จำนวนงานรายเดือน ปี {selectedYear + 543}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                            <p className="font-medium text-foreground">{data.fullMonth}</p>
                            <p className="text-sm text-muted-foreground">{data.count} งาน</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {monthlyChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedMonth(index)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
              <div className="text-center p-4 rounded-xl bg-amber-500/10">
                <p className="text-3xl font-bold text-amber-600">{allStats.acknowledged}</p>
                <p className="text-sm text-muted-foreground">รับทราบงาน</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-500/10">
                <p className="text-3xl font-bold text-blue-600">{allStats.in_progress}</p>
                <p className="text-sm text-muted-foreground">ดำเนินงาน</p>
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
                         {formatThaiDateShort(event.date)} • {event.start_time} - {event.end_time}
                      </p>
                    </div>
                    <Badge variant={
                      event.status === 'in_progress' ? 'default' :
                      event.status === 'completed' ? 'outline' : 'secondary'
                    }>
                      {event.status === 'acknowledged' && 'รับทราบงาน'}
                      {event.status === 'in_progress' && 'ดำเนินงาน'}
                      {event.status === 'completed' && 'เสร็จสิ้นงาน'}
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
