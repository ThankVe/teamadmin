import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEventsData, Event } from '@/hooks/useEvents';
import { useEventCategories } from '@/hooks/useEventCategories';
import { EditEventDialog } from '@/components/events/EditEventDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Edit,
  MoreVertical,
  PlusCircle,
  Trash2,
  XCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Search,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UpdateStatusDialog } from '@/components/events/UpdateStatusDialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const statusConfig = {
  acknowledged: { label: 'รับทราบงาน', variant: 'secondary' as const },
  in_progress: { label: 'ดำเนินงาน', variant: 'default' as const },
  completed: { label: 'เสร็จสิ้นงาน', variant: 'outline' as const },
  pending: { label: 'รอดำเนินการ', variant: 'secondary' as const },
  confirmed: { label: 'ยืนยันแล้ว', variant: 'default' as const },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' as const },
};

const ManageEvents = () => {
  const now = new Date();
  const { user, isAdmin, canManageEvents, isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading, deleteEvent, updateEvent, refetch } = useEventsData();
  const { categories, isLoading: categoriesLoading } = useEventCategories();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditSearch, setQuickEditSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  const navigateMonth = (dir: number) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEvent(deleteId);
      setDeleteId(null);
    }
  };

  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const matchMonth = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
    const matchCategory = filterCategoryId === 'all' || e.category_id === filterCategoryId;
    return matchMonth && matchCategory;
  });

  const isLoading = authLoading || eventsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
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
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 border border-input rounded-md">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-[120px] border-0 shadow-none h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {thaiMonths.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[90px] border-0 shadow-none h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y + 543}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigateMonth(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(true)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              อัปเดตสถานะ
            </Button>
            <Button
              onClick={() => navigate('/admin/add-event')}
              className="gradient-pink text-primary-foreground gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              เพิ่มงานใหม่
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">ทุกประเภท</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {filterCategoryId !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterCategoryId('all')}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่องาน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เวลา</TableHead>
                    <TableHead>สถานที่</TableHead>
                    <TableHead>ทีมงาน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        {filterCategoryId === 'all' ? 'ยังไม่มีงาน' : 'ไม่พบงานในประเภทนี้'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => {
                      const status = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.acknowledged;
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">{event.activity_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {event.category ? (
                              <Badge variant="outline">{event.category.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                                  className="gap-2"
                                  onClick={() => setEditingEvent(event)}
                                >
                                  <Edit className="w-4 h-4" />
                                  แก้ไข
                                </DropdownMenuItem>
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

        {/* Edit Dialog */}
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          onSave={updateEvent}
        />
        {/* Update Status Dialog */}
        <UpdateStatusDialog
          events={filteredEvents}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onStatusUpdated={refetch}
        />
      </div>
    </MainLayout>
  );
};

export default ManageEvents;
