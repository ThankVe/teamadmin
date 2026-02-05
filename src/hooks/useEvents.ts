import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EventPhotographer {
  id: string;
  team_member_id: string;
  team_members: {
    id: string;
    name: string;
  };
}

export interface EventInput {
  title: string;
  activity_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
  cover_image_url: string | null;
  status: string;
  category_id?: string | null;
  equipment?: string | null;
  shooting_focus?: string | null;
  additional_details?: string | null;
}

export interface Event {
  id: string;
  title: string;
  activity_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
  cover_image_url: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  equipment: string | null;
  shooting_focus: string | null;
  additional_details: string | null;
  photographers?: Array<{ id: string; name: string }>;
  category?: { id: string; name: string; description: string | null; requirements: string | null } | null;
}

export const useEventsData = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*, event_categories(id, name, description, requirements)')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch photographers for each event
      const eventsWithPhotographers = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: photographersData } = await supabase
            .from('event_photographers')
            .select('id, team_member_id, team_members(id, name)')
            .eq('event_id', event.id);

          const photographers = (photographersData || []).map((p: any) => ({
            id: p.team_members.id,
            name: p.team_members.name,
          }));

          const category = event.event_categories || null;
          delete (event as any).event_categories;

          return { ...event, photographers, category };
        })
      );

      setEvents(eventsWithPhotographers);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEvent = async (
    eventData: EventInput,
    photographerIds: string[]
  ) => {
    try {
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          ...eventData,
          created_by: user?.id,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Add photographers
      if (photographerIds.length > 0) {
        const photographerRecords = photographerIds.map(id => ({
          event_id: newEvent.id,
          team_member_id: id,
        }));

        await supabase.from('event_photographers').insert(photographerRecords);
      }

      // Fetch photographer names for notification
      let photographerNames: Array<{ id: string; name: string }> = [];
      if (photographerIds.length > 0) {
        const { data: teamData } = await supabase
          .from('team_members')
          .select('id, name')
          .in('id', photographerIds);
        photographerNames = teamData || [];
      }

      // Send Telegram notification with photographers and image
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            event: {
              title: eventData.title,
              activity_name: eventData.activity_name,
              date: eventData.date,
              start_time: eventData.start_time,
              end_time: eventData.end_time,
              location: eventData.location,
              cover_image_url: eventData.cover_image_url,
              photographers: photographerNames,
            },
          },
        });
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
      }

       // Send in-app notifications to assigned photographers
       if (photographerIds.length > 0) {
         try {
           // Get user_ids for the assigned team members
           const { data: teamMembersData } = await supabase
             .from('team_members')
             .select('user_id')
             .in('id', photographerIds)
             .not('user_id', 'is', null);

           if (teamMembersData && teamMembersData.length > 0) {
             const notificationRecords = teamMembersData
               .filter(tm => tm.user_id)
               .map(tm => ({
                 user_id: tm.user_id as string,
                 title: 'งานใหม่ที่ได้รับมอบหมาย',
                 message: `คุณได้รับมอบหมายให้ทำงาน "${eventData.title}" ในวันที่ ${eventData.date}`,
                 type: 'job_assigned',
                 event_id: newEvent.id,
               }));

             if (notificationRecords.length > 0) {
               await supabase.from('notifications').insert(notificationRecords);
             }
           }
         } catch (notificationError) {
           console.error('Error sending in-app notifications:', notificationError);
         }
       }

      await fetchEvents();
      
      toast({
        title: 'เพิ่มงานสำเร็จ',
        description: 'งานใหม่ถูกเพิ่มเข้าระบบแล้ว',
      });
      
      return { data: newEvent, error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มงานได้',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateEvent = async (
    id: string,
    updates: Partial<Event>,
    photographerIds?: string[]
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update photographers if provided
      if (photographerIds !== undefined) {
        await supabase.from('event_photographers').delete().eq('event_id', id);
        
        if (photographerIds.length > 0) {
          const photographerRecords = photographerIds.map(pid => ({
            event_id: id,
            team_member_id: pid,
          }));
          await supabase.from('event_photographers').insert(photographerRecords);
        }
      }

      await fetchEvents();
      
      toast({
        title: 'อัปเดตสำเร็จ',
        description: 'ข้อมูลงานถูกอัปเดตแล้ว',
      });
      
      return { error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตงานได้',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      
      setEvents(prev => prev.filter(e => e.id !== id));
      
      toast({
        title: 'ลบงานสำเร็จ',
        description: 'งานถูกลบออกจากระบบแล้ว',
      });
      
      return { error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบงานได้',
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
