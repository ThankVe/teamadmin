import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type BucketType = 'banners' | 'event-covers' | 'login-backgrounds' | 'avatars';

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File, bucket: BucketType, folder?: string) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      toast({
        title: 'อัปโหลดสำเร็จ',
        description: 'รูปภาพถูกอัปโหลดแล้ว',
      });

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปโหลดรูปภาพได้',
        variant: 'destructive',
      });
      return { url: null, error };
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (url: string, bucket: BucketType) => {
    try {
      // Extract file path from URL
      const urlParts = url.split(`${bucket}/`);
      if (urlParts.length < 2) return { error: new Error('Invalid URL') };
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { error };
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
  };
};
