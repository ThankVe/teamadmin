import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEvents } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, XCircle, PlusCircle, Send } from 'lucide-react';
import { EventItem } from '@/types/event';

const AddEvent = () => {
  const { team, addEvent, isAuthenticated } = useEvents();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    activityName: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    photographers: [] as string[],
    status: 'pending' as EventItem['status'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPhotographers = team.filter(member =>
      formData.photographers.includes(member.id)
    );

    addEvent({
      ...formData,
      photographers: selectedPhotographers,
    });

    toast({
      title: 'เพิ่มงานสำเร็จ',
      description: 'งานใหม่ถูกเพิ่มเข้าระบบแล้ว',
    });

    // TODO: Send Telegram notification here

    navigate('/admin/manage-events');
  };

  const togglePhotographer = (id: string) => {
    setFormData(prev => ({
      ...prev,
      photographers: prev.photographers.includes(id)
        ? prev.photographers.filter(p => p !== id)
        : [...prev.photographers, id],
    }));
  };

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
                กรุณาเข้าสู่ระบบเพื่อเพิ่มงาน
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">เพิ่มงานใหม่</h1>
          <p className="text-muted-foreground mt-1">
            กรอกรายละเอียดงานที่ต้องการเพิ่ม
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" />
              รายละเอียดงาน
            </CardTitle>
            <CardDescription>
              เมื่อเพิ่มงาน ระบบจะแจ้งเตือนไปยัง Telegram อัตโนมัติ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">ชื่องาน *</Label>
                <Input
                  id="title"
                  placeholder="เช่น งานปฐมนิเทศนักศึกษาใหม่"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Activity Name */}
              <div className="space-y-2">
                <Label htmlFor="activityName">ชื่อกิจกรรม *</Label>
                <Input
                  id="activityName"
                  placeholder="เช่น ปฐมนิเทศ ประจำปีการศึกษา 2568"
                  value={formData.activityName}
                  onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    วันที่จัดกิจกรรม *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    เวลาเริ่ม *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    เวลาสิ้นสุด *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  สถานที่
                </Label>
                <Input
                  id="location"
                  placeholder="เช่น หอประชุมใหญ่"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียดเพิ่มเติม</Label>
                <Textarea
                  id="description"
                  placeholder="รายละเอียดหรือหมายเหตุเพิ่มเติม..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as EventItem['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
                    <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photographers */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  ช่างภาพที่รับผิดชอบ
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => togglePhotographer(member.id)}
                    >
                      <Checkbox
                        id={`photographer-${member.id}`}
                        checked={formData.photographers.includes(member.id)}
                        onCheckedChange={() => togglePhotographer(member.id)}
                      />
                      <label
                        htmlFor={`photographer-${member.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/manage-events')}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" className="gradient-pink text-primary-foreground gap-2">
                  <Send className="w-4 h-4" />
                  เพิ่มงานและแจ้งเตือน
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AddEvent;
