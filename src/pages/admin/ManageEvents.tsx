import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEventsData } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Camera,
  MoreVertical,
  PlusCircle,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig = {
  pending: { label: 'รอดำเนินการ', variant: 'secondary' as const },
  confirmed: { label: 'ยืนยันแล้ว', variant: 'default' as const },
  completed: { label: 'เสร็จสิ้น', variant: 'outline' as const },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' as const },
};

const ManageEvents = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading, deleteEvent } = useEventsData();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEvent(deleteId);
      setDeleteId(null);
    }
  };

  if (authLoading || eventsLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!user || !isAdmin) {
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
                กรุณาเข้าสู่ระบบด้วยบัญชี Admin เพื่อจัดการงาน
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Camera className="w-8 h-8 text-primary" />
              จัดการงาน
            </h1>
            <p className="text-muted-foreground mt-1">
              ดู แก้ไข และลบงานทั้งหมด
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/add-event')}
            className="gradient-pink text-primary-foreground gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            เพิ่มงานใหม่
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่องาน</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เวลา</TableHead>
                    <TableHead>สถานที่</TableHead>
                    <TableHead>ช่างภาพ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        ยังไม่มีงาน
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => {
                      const status = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.pending;
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">{event.activity_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(event.date).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            {event.start_time} - {event.end_time}
                          </TableCell>
                          <TableCell>{event.location || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(event.photographers || []).slice(0, 2).map((p) => (
                                <Badge key={p.id} variant="secondary" className="text-xs">
                                  {p.name}
                                </Badge>
                              ))}
                              {(event.photographers?.length || 0) > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(event.photographers?.length || 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="gap-2 text-destructive focus:text-destructive"
                                  onClick={() => setDeleteId(event.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  ลบ
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบงาน?</AlertDialogTitle>
              <AlertDialogDescription>
                การลบนี้ไม่สามารถยกเลิกได้ งานจะถูกลบออกจากระบบถาวร
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default ManageEvents;
