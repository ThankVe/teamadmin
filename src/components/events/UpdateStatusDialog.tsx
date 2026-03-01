import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Camera, RefreshCw } from 'lucide-react';
import { Event } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateStatusDialogProps {
  events: Event[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated: () => void;
}

const statusOptions = [
  { value: 'acknowledged', label: 'รับทราบงาน', color: '#EAB308' },
  { value: 'in_progress', label: 'ดำเนินงาน', color: '#3B82F6' },
  { value: 'completed', label: 'เสร็จสิ้นงาน', color: '#22C55E' },
];

export const UpdateStatusDialog = ({
  events,
  open,
  onOpenChange,
  onStatusUpdated,
}: UpdateStatusDialogProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  useEffect(() => {
    if (open) {
      setSelectedEventId('');
      setSelectedStatus('');
      setNotifyTelegram(false);
    }
  }, [open]);

  useEffect(() => {
    if (selectedEvent) {
      setSelectedStatus(selectedEvent.status);
    }
  }, [selectedEvent]);

  const handleSave = async () => {
    if (!selectedEventId || !selectedStatus) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: selectedStatus })
        .eq('id', selectedEventId);

      if (error) throw error;

      if (notifyTelegram && selectedEvent) {
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: {
              statusUpdate: {
                title: selectedEvent.title,
                activity_name: selectedEvent.activity_name,
                date: selectedEvent.date,
                oldStatus: selectedEvent.status,
                newStatus: selectedStatus,
              },
            },
          });
        } catch (telegramError) {
          console.error('Telegram notification error:', telegramError);
        }
      }

      toast({
        title: 'อัปเดตสถานะสำเร็จ',
        description: `สถานะงาน "${selectedEvent?.title}" ถูกอัปเดตแล้ว`,
      });

      onStatusUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตสถานะได้',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Camera className="w-5 h-5 text-primary" />
            อัปเดตสถานะงาน
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Event Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">เลือกงาน</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">-- เลือกงาน --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} - {event.activity_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Options */}
          {selectedEventId && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                สถานะงาน
              </label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setSelectedStatus(status.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      selectedStatus === status.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background hover:border-muted-foreground/30'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Telegram Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 mt-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">แจ้งเตือน Telegram</p>
                    <p className="text-xs text-muted-foreground">
                      ส่งแจ้งเตือนเมื่อเปลี่ยนสถานะงาน
                    </p>
                  </div>
                </div>
                <Switch checked={notifyTelegram} onCheckedChange={setNotifyTelegram} />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving || selectedStatus === selectedEvent?.status}
                className="w-full gradient-pink text-primary-foreground gap-2 mt-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                {isSaving ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
