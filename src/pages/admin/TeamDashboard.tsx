import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEventsData } from '@/hooks/useEvents';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { parseDateString } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, TrendingUp, Award, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const months = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

interface TeamMemberWorkload {
  id: string;
  name: string;
  avatar_url: string | null;
  totalJobs: number;
  acknowledged: number;
  in_progress: number;
  completed: number;
  events: Array<{ id: string; title: string; date: string; status: string }>;
}

const TeamDashboard = () => {
  const { user, canManageEvents, isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading } = useEventsData();
  const { teamMembers, isLoading: teamLoading } = useTeamMembers();

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

  // Calculate workload per team member for selected month
  const teamWorkload = useMemo<TeamMemberWorkload[]>(() => {
    return teamMembers.map(member => {
      const memberEvents = events.filter(event => {
        const eventDate = parseDateString(event.date);
        const inMonth = eventDate.getFullYear() === selectedYear && eventDate.getMonth() === selectedMonth;
        const assigned = event.photographers?.some(p => p.id === member.id);
        return inMonth && assigned;
      });

      return {
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
        totalJobs: memberEvents.length,
        acknowledged: memberEvents.filter(e => e.status === 'acknowledged').length,
        in_progress: memberEvents.filter(e => e.status === 'in_progress').length,
        completed: memberEvents.filter(e => e.status === 'completed').length,
        events: memberEvents.map(e => ({ id: e.id, title: e.title, date: e.date, status: e.status })),
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }, [teamMembers, events, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    return teamWorkload
      .filter(m => m.totalJobs > 0)
      .map(m => ({
        name: m.name.length > 12 ? m.name.slice(0, 12) + '…' : m.name,
        fullName: m.name,
        jobs: m.totalJobs,
        acknowledged: m.acknowledged,
        in_progress: m.in_progress,
        completed: m.completed,
      }));
  }, [teamWorkload]);

  const summary = useMemo(() => {
    const activeMembers = teamWorkload.filter(m => m.totalJobs > 0).length;
    const totalAssignments = teamWorkload.reduce((sum, m) => sum + m.totalJobs, 0);
    const maxJobs = Math.max(...teamWorkload.map(m => m.totalJobs), 0);
    const topMember = teamWorkload.find(m => m.totalJobs === maxJobs && maxJobs > 0);
    return { activeMembers, totalAssignments, topMember, maxJobs };
  }, [teamWorkload]);

  const isLoading = authLoading || eventsLoading || teamLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
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
              <p className="text-muted-foreground">กรุณาเข้าสู่ระบบเพื่อดูข้อมูลทีมงาน</p>
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
            <h1 className="text-3xl font-bold text-foreground">Dashboard ทีมงาน</h1>
            <p className="text-muted-foreground mt-1">ภาระงานของทีมงานแต่ละคนรายเดือน</p>
          </div>

          {/* Month/Year Selector */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <select
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="h-10 w-36 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {months.map((month, index) => (
                <option key={index} value={index.toString()}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {years.map(year => (
                <option key={year} value={year.toString()}>{year + 543}</option>
              ))}
            </select>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ทีมงานที่มีงาน</p>
                <p className="text-3xl font-bold text-foreground">{summary.activeMembers}<span className="text-lg text-muted-foreground">/{teamMembers.length}</span></p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">งานที่มอบหมายทั้งหมด</p>
                <p className="text-3xl font-bold text-foreground">{summary.totalAssignments}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รับงานมากที่สุด</p>
                <p className="text-lg font-bold text-foreground truncate">
                  {summary.topMember ? `${summary.topMember.name} (${summary.maxJobs})` : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                จำนวนงานแต่ละคน — {months[selectedMonth]} {selectedYear + 543}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-foreground">{data.fullName}</p>
                              <p className="text-sm text-muted-foreground">งานทั้งหมด: {data.jobs}</p>
                              <p className="text-sm text-yellow-600">รับทราบ: {data.acknowledged}</p>
                              <p className="text-sm text-blue-600">ดำเนินงาน: {data.in_progress}</p>
                              <p className="text-sm text-muted-foreground">เสร็จสิ้น: {data.completed}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="jobs" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Member Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teamWorkload.map(member => (
            <Card key={member.id} className={member.totalJobs > 0 ? 'hover-lift' : 'opacity-60'}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.totalJobs} งานในเดือนนี้</p>
                  </div>
                  <Badge variant={member.totalJobs > 0 ? 'default' : 'secondary'} className="text-lg px-3">
                    {member.totalJobs}
                  </Badge>
                </div>

                {member.totalJobs > 0 && (
                  <>
                    {/* Status breakdown */}
                    <div className="flex gap-2 mb-3">
                      {member.acknowledged > 0 && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                          รับทราบ {member.acknowledged}
                        </Badge>
                      )}
                      {member.in_progress > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          ดำเนินงาน {member.in_progress}
                        </Badge>
                      )}
                      {member.completed > 0 && (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                          เสร็จสิ้น {member.completed}
                        </Badge>
                      )}
                    </div>

                    {/* Event list */}
                    <div className="space-y-1.5">
                      {member.events.map(evt => (
                        <div key={evt.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/50">
                          <span className="truncate flex-1 mr-2">{evt.title}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {parseDateString(evt.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {teamWorkload.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">ยังไม่มีทีมงานในระบบ</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default TeamDashboard;
