import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'user';
  created_at: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users_with_roles');

      if (error) throw error;
      setUsers((data || []) as UserWithRole[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'editor' | 'user') => {
    try {
      // First check if user already has a role entry
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );

      const roleLabels = {
        admin: 'ผู้ดูแลระบบ',
        editor: 'ผู้จัดการงาน',
        user: 'ทีมงาน'
      };

      toast({
        title: 'อัปเดตบทบาทสำเร็จ',
        description: `เปลี่ยนบทบาทเป็น ${roleLabels[newRole]} แล้ว`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเปลี่ยนบทบาทได้',
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    updateUserRole,
    refetch: fetchUsers,
  };
};
