import { MainLayout } from '@/components/layout/MainLayout';
import { useEvents } from '@/contexts/EventContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, XCircle } from 'lucide-react';

const Team = () => {
  const { team, events, isAuthenticated } = useEvents();

  // Count events per photographer
  const photographerStats = team.map((member) => {
    const eventCount = events.filter((event) =>
      event.photographers.some((p) => p.id === member.id)
    ).length;
    return { ...member, eventCount };
  });

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
                กรุณาเข้าสู่ระบบเพื่อดูทีมงาน
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              ทีมงาน
            </h1>
            <p className="text-muted-foreground mt-1">
              รายชื่อทีมช่างภาพและวิดีโอ
            </p>
          </div>
          <Badge variant="secondary" className="text-base px-4 py-2">
            {team.length} คน
          </Badge>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photographerStats.map((member) => (
            <Card key={member.id} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ช่างภาพ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{member.eventCount}</p>
                    <p className="text-xs text-muted-foreground">งาน</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Team;
