 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface Notification {
   id: string;
   user_id: string;
   title: string;
   message: string;
   type: string;
   event_id: string | null;
   is_read: boolean;
   created_at: string;
 }
 
 export const useNotifications = () => {
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
   const { user } = useAuth();
 
   const fetchNotifications = useCallback(async () => {
     if (!user) {
       setNotifications([]);
       setUnreadCount(0);
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from('notifications')
         .select('*')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false })
         .limit(50);
 
       if (error) throw error;
 
       setNotifications(data || []);
       setUnreadCount((data || []).filter(n => !n.is_read).length);
     } catch (error) {
       console.error('Error fetching notifications:', error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   const markAsRead = async (notificationId: string) => {
     try {
       const { error } = await supabase
         .from('notifications')
         .update({ is_read: true })
         .eq('id', notificationId);
 
       if (error) throw error;
 
       setNotifications(prev =>
         prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
       );
       setUnreadCount(prev => Math.max(0, prev - 1));
     } catch (error) {
       console.error('Error marking notification as read:', error);
     }
   };
 
   const markAllAsRead = async () => {
     if (!user) return;
 
     try {
       const { error } = await supabase
         .from('notifications')
         .update({ is_read: true })
         .eq('user_id', user.id)
         .eq('is_read', false);
 
       if (error) throw error;
 
       setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
       setUnreadCount(0);
     } catch (error) {
       console.error('Error marking all notifications as read:', error);
     }
   };
 
   const deleteNotification = async (notificationId: string) => {
     try {
       const { error } = await supabase
         .from('notifications')
         .delete()
         .eq('id', notificationId);
 
       if (error) throw error;
 
       const notification = notifications.find(n => n.id === notificationId);
       if (notification && !notification.is_read) {
         setUnreadCount(prev => Math.max(0, prev - 1));
       }
       setNotifications(prev => prev.filter(n => n.id !== notificationId));
     } catch (error) {
       console.error('Error deleting notification:', error);
     }
   };
 
   useEffect(() => {
     fetchNotifications();
   }, [fetchNotifications]);
 
   // Subscribe to realtime notifications
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel('notifications')
       .on(
         'postgres_changes',
         {
           event: 'INSERT',
           schema: 'public',
           table: 'notifications',
           filter: `user_id=eq.${user.id}`,
         },
         (payload) => {
           const newNotification = payload.new as Notification;
           setNotifications(prev => [newNotification, ...prev]);
           setUnreadCount(prev => prev + 1);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user]);
 
   return {
     notifications,
     unreadCount,
     isLoading,
     markAsRead,
     markAllAsRead,
     deleteNotification,
     refetch: fetchNotifications,
   };
 };