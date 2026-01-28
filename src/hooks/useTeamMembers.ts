import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTeamMember = async (member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      
      setTeamMembers(prev => [...prev, data]);
      toast({
        title: 'เพิ่มทีมงานสำเร็จ',
        description: `${member.name} ถูกเพิ่มเข้าระบบแล้ว`,
      });
      return { data, error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มทีมงานได้',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTeamMembers(prev => prev.map(m => m.id === id ? data : m));
      toast({
        title: 'อัปเดตสำเร็จ',
        description: 'ข้อมูลทีมงานถูกอัปเดตแล้ว',
      });
      return { data, error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตข้อมูลได้',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      setTeamMembers(prev => prev.filter(m => m.id !== id));
      toast({
        title: 'ลบทีมงานสำเร็จ',
        description: 'ทีมงานถูกลบออกจากระบบแล้ว',
      });
      return { error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบทีมงานได้',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const importFromExcel = async (members: Array<{ name: string; email?: string; phone?: string; role?: string }>) => {
    try {
      const membersToInsert = members.map(m => ({
        name: m.name,
        email: m.email || null,
        phone: m.phone || null,
        role: m.role || 'photographer',
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('team_members')
        .insert(membersToInsert)
        .select();

      if (error) throw error;
      
      setTeamMembers(prev => [...prev, ...(data || [])]);
      toast({
        title: 'นำเข้าสำเร็จ',
        description: `นำเข้า ${data?.length || 0} รายชื่อแล้ว`,
      });
      return { data, error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถนำเข้าข้อมูลได้',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    isLoading,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    importFromExcel,
    refetch: fetchTeamMembers,
  };
};
