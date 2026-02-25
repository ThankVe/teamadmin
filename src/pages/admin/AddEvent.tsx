import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useEventsData } from '@/hooks/useEvents';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, Clock, MapPin, Users, XCircle, PlusCircle, Send, Upload, Loader2, 
  Image as ImageIcon, Briefcase, Camera, FileText, Package, Dices
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SpinningWheel } from '@/components/events/SpinningWheel';

const AddEvent = () => {
  const { user, isAdmin, canManageEvents, isLoading: authLoading } = useAuth();
  const { teamMembers, isLoading: teamLoading } = useTeamMembers();
  const { categories, isLoading: categoriesLoading } = useEventCategories();
  const { addEvent } = useEventsData();
  const { uploadImage, isUploading } = useImageUpload();
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    activity_name: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    status: 'acknowledged' as string,
    cover_image_url: null as string | null,
    category_id: null as string | null,
    equipment: '',
    shooting_focus: '',
    additional_details: '',
  });
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageLink, setCoverImageLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addEvent(formData, selectedPhotographers);
      if (!result.error) {
        navigate('/admin/manage-events');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePhotographer = (id: string) => {
    setSelectedPhotographers(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleCoverUpload = async (file: File) => {
    const { url, error } = await uploadImage(file, 'event-covers');
    if (!error && url) {
      setFormData(prev => ({ ...prev, cover_image_url: url }));
      setCoverImageLink('');
    }
  };

  const handleCoverLinkChange = (link: string) => {
    setCoverImageLink(link);
    if (link) {
      setFormData(prev => ({ ...prev, cover_image_url: link }));
    }
  };

  const isLoading = authLoading || teamLoading || categoriesLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 max-w-3xl mx-auto space-y-6">
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
                กรุณาเข้าสู่ระบบด้วยบัญชี Admin เพื่อเพิ่มงาน
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
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  ประเภทงาน *
                </Label>
                <select
                  id="category"
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value || null }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">เลือกประเภทงาน</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formData.category_id && (
                  <p className="text-sm text-muted-foreground">
                    {categories.find(c => c.id === formData.category_id)?.requirements}
                  </p>
                )}
              </div>

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
                  value={formData.activity_name}
                  onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                  required
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  รูปกิจกรรม
                </Label>
                {formData.cover_image_url && (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                    <img
                      src={formData.cover_image_url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    อัปโหลดรูป
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverLink" className="text-sm text-muted-foreground">หรือใส่ลิงก์รูปภาพ</Label>
                  <Input
                    id="coverLink"
                    placeholder="https://example.com/image.jpg"
                    value={coverImageLink}
                    onChange={(e) => handleCoverLinkChange(e.target.value)}
                  />
                </div>
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
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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

              {/* Equipment */}
              <div className="space-y-2">
                <Label htmlFor="equipment" className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  อุปกรณ์ที่ต้องนำไป
                </Label>
                <Textarea
                  id="equipment"
                  placeholder="เช่น กล้อง DSLR, ขาตั้งกล้อง, ไฟ LED..."
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Shooting Focus */}
              <div className="space-y-2">
                <Label htmlFor="shootingFocus" className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  รายละเอียดงาน (สิ่งที่ต้องเน้น)
                </Label>
                <Textarea
                  id="shootingFocus"
                  placeholder="เช่น เน้นถ่ายเจ้าภาพงานเป็นหลัก, ถ่ายพิธีเปิด-ปิด, ถ่ายบรรยากาศผู้เข้าร่วม..."
                  value={formData.shooting_focus}
                  onChange={(e) => setFormData({ ...formData, shooting_focus: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="additionalDetails" className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  รายละเอียดเพิ่มเติม
                </Label>
                <Textarea
                  id="additionalDetails"
                  placeholder="รายละเอียดหรือหมายเหตุเพิ่มเติม..."
                  value={formData.additional_details}
                  onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Description (legacy field) */}
              <div className="space-y-2">
                <Label htmlFor="description">หมายเหตุ</Label>
                <Textarea
                  id="description"
                  placeholder="หมายเหตุอื่นๆ..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Status - Fixed to acknowledged on create */}
              <div className="space-y-2">
                <Label>สถานะเริ่มต้น</Label>
                <div className="p-3 bg-secondary/50 rounded-lg border">
                  <span className="text-sm font-medium">รับทราบงาน</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    สถานะเริ่มต้นของงานใหม่จะเป็น "รับทราบงาน" เสมอ
                  </p>
                </div>
              </div>

              {/* Photographers */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  ทีมงานที่รับผิดชอบ
                </Label>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีทีมงาน กรุณาเพิ่มทีมงานก่อน
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => togglePhotographer(member.id)}
                        >
                          <Checkbox
                            id={`photographer-${member.id}`}
                            checked={selectedPhotographers.includes(member.id)}
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
                    {teamMembers.length >= 2 && (
                      <div className="flex justify-center pt-2">
                        <SpinningWheel
                          teamMembers={teamMembers}
                          onSelect={togglePhotographer}
                          selectedPhotographers={selectedPhotographers}
                        />
                      </div>
                    )}
                  </>
                )}
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
                <Button 
                  type="submit" 
                  className="gradient-pink text-primary-foreground gap-2"
                  disabled={isSubmitting || !formData.category_id}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
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
