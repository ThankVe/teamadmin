import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TelegramGroup {
  id: string;
  name: string;
  chat_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTelegramGroups = () => {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching telegram groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGroup = async (name: string, chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('telegram_groups')
        .insert({ name, chat_id: chatId })
        .select()
        .single();

      if (error) throw error;

      setGroups(prev => [...prev, data]);
      toast({
        title: 'เพิ่มกลุ่มสำเร็จ',
        description: `กลุ่ม "${name}" ถูกเพิ่มแล้ว`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มกลุ่มได้',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateGroup = async (id: string, updates: Partial<TelegramGroup>) => {
    try {
      const { data, error } = await supabase
        .from('telegram_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGroups(prev => prev.map(g => g.id === id ? data : g));
      toast({
        title: 'อัปเดตสำเร็จ',
        description: 'ข้อมูลกลุ่มถูกอัปเดตแล้ว',
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตกลุ่มได้',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('telegram_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== id));
      toast({
        title: 'ลบกลุ่มสำเร็จ',
        description: 'กลุ่มถูกลบออกจากระบบแล้ว',
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบกลุ่มได้',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const testNotification = async (chatId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          test: true,
          chatId,
          event: {
            title: 'ทดสอบการแจ้งเตือน',
            activity_name: 'Test Notification',
            date: new Date().toISOString().split('T')[0],
            start_time: '09:00',
            end_time: '17:00',
            location: 'ระบบทดสอบ',
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'ส่งการแจ้งเตือนสำเร็จ ✅',
          description: 'ตรวจสอบ Telegram ของคุณ',
        });
      } else {
        const errorMsg = data?.error || 'ไม่ทราบสาเหตุ';
        toast({
          title: 'ไม่สามารถส่งได้',
          description: `${errorMsg}`,
          variant: 'destructive',
        });
      }

      return { success: data?.success || false };
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error?.message || 'ไม่สามารถเชื่อมต่อระบบได้',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    isLoading,
    addGroup,
    updateGroup,
    deleteGroup,
    testNotification,
    refetch: fetchGroups,
  };
};
