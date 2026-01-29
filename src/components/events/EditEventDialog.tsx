import { useState, useEffect, useRef } from 'react';
import { Event, EventInput } from '@/hooks/useEvents';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, Clock, MapPin, Users, Loader2, Briefcase, 
  Package, Camera, FileText, Upload, Image as ImageIcon 
} from 'lucide-react';

interface EditEventDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    updates: Partial<EventInput>,
    photographerIds: string[]
  ) => Promise<{ error: any }>;
}

const statusOptions = [
  { value: 'acknowledged', label: 'รับทราบงาน' },
  { value: 'in_progress', label: 'ดำเนินงาน' },
  { value: 'completed', label: 'เสร็จสิ้นงาน' },
];

export const EditEventDialog = ({
  event,
  open,
  onOpenChange,
  onSave,
}: EditEventDialogProps) => {
  const { teamMembers } = useTeamMembers();
  const { categories } = useEventCategories();
  const { uploadImage, isUploading } = useImageUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    activity_name: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    status: 'acknowledged',
    category_id: null as string | null,
    equipment: '',
    shooting_focus: '',
    additional_details: '',
    cover_image_url: null as string | null,
  });
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [coverImageLink, setCoverImageLink] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        activity_name: event.activity_name,
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location || '',
        description: event.description || '',
        status: event.status,
        category_id: event.category_id,
        equipment: event.equipment || '',
        shooting_focus: event.shooting_focus || '',
        additional_details: event.additional_details || '',
        cover_image_url: event.cover_image_url,
      });
      setSelectedPhotographers(event.photographers?.map((p) => p.id) || []);
      setCoverImageLink('');
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setIsSubmitting(true);
    const result = await onSave(
      event.id,
      {
        title: formData.title,
        activity_name: formData.activity_name,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location || null,
        description: formData.description || null,
        status: formData.status,
        cover_image_url: formData.cover_image_url,
        category_id: formData.category_id,
        equipment: formData.equipment || null,
        shooting_focus: formData.shooting_focus || null,
        additional_details: formData.additional_details || null,
      },
      selectedPhotographers
    );
    setIsSubmitting(false);

    if (!result.error) {
      onOpenChange(false);
    }
  };

  const togglePhotographer = (id: string) => {
    setSelectedPhotographers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
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

  const activeMembers = teamMembers.filter((m) => m.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>แก้ไขกิจกรรม</DialogTitle>
          <DialogDescription>
            แก้ไขรายละเอียดกิจกรรมและกดบันทึกเมื่อเสร็จสิ้น
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  ประเภทงาน
                </Label>
                <select
                  id="edit-category"
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value || null }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">เลือกประเภทงาน</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">ชื่องาน *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Activity Name */}
              <div className="space-y-2">
                <Label htmlFor="activity_name">ชื่อกิจกรรม *</Label>
                <Input
                  id="activity_name"
                  value={formData.activity_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      activity_name: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  รูปกิจกรรม
                </Label>
                {formData.cover_image_url && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
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
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    อัปโหลด
                  </Button>
                </div>
                <Input
                  placeholder="หรือใส่ลิงก์รูปภาพ"
                  value={coverImageLink}
                  onChange={(e) => handleCoverLinkChange(e.target.value)}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  วันที่ *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    เวลาเริ่ม *
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start_time: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    เวลาสิ้นสุด *
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        end_time: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  สถานที่
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="ไม่ระบุ"
                />
              </div>

              {/* Equipment */}
              <div className="space-y-2">
                <Label htmlFor="equipment" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  อุปกรณ์ที่ต้องนำไป
                </Label>
                <Textarea
                  id="equipment"
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, equipment: e.target.value }))
                  }
                  rows={2}
                  placeholder="เช่น กล้อง DSLR, ขาตั้งกล้อง..."
                />
              </div>

              {/* Shooting Focus */}
              <div className="space-y-2">
                <Label htmlFor="shooting_focus" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  รายละเอียดงาน (สิ่งที่ต้องเน้น)
                </Label>
                <Textarea
                  id="shooting_focus"
                  value={formData.shooting_focus}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, shooting_focus: e.target.value }))
                  }
                  rows={2}
                  placeholder="เช่น เน้นถ่ายเจ้าภาพงานเป็นหลัก..."
                />
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="additional_details" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  รายละเอียดเพิ่มเติม
                </Label>
                <Textarea
                  id="additional_details"
                  value={formData.additional_details}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, additional_details: e.target.value }))
                  }
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">หมายเหตุ</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="หมายเหตุอื่นๆ..."
                />
              </div>

              {/* Photographers */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  ทีมงานที่รับผิดชอบ
                </Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {activeMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      ไม่มีทีมงานในระบบ
                    </p>
                  ) : (
                    activeMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3"
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
                          {member.role && (
                            <span className="text-muted-foreground ml-2">
                              ({member.role})
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
