import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EventCategory {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  created_at: string;
  updated_at: string;
}

export const useEventCategories = () => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('event_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async (category: {
    name: string;
    description?: string;
    requirements?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('event_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));

      toast({
        title: 'เพิ่มประเภทงานสำเร็จ',
        description: `เพิ่ม "${category.name}" เรียบร้อยแล้ว`,
      });

      return { data, error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มประเภทงานได้',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Pick<EventCategory, 'name' | 'description' | 'requirements'>>
  ) => {
    try {
      const { error } = await supabase
        .from('event_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      toast({
        title: 'อัปเดตประเภทงานสำเร็จ',
      });

      return { error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตประเภทงานได้',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== id));

      toast({
        title: 'ลบประเภทงานสำเร็จ',
      });

      return { error: null };
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบประเภทงานได้',
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};
