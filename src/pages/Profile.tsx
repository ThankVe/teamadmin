import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Save, Upload, Loader2, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { uploadImage, isUploading } = useImageUpload();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
        });
      } else {
        setFormData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setPendingAvatarFile(file);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      let avatarUrl = profile?.avatar_url || null;

      // Upload avatar if pending
      if (pendingAvatarFile) {
        const { url, error } = await uploadImage(pendingAvatarFile, 'avatars');
        if (!error && url) {
          avatarUrl = url;
        }
      }

      const updates = {
        full_name: formData.full_name || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear pending states
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
      setPendingAvatarFile(null);
      
      // Refresh profile
      await fetchProfile();

      toast({
        title: 'บันทึกสำเร็จ',
        description: 'ข้อมูลโปรไฟล์ถูกอัปเดตแล้ว',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  const displayAvatar = avatarPreview || profile?.avatar_url;
  const userInitials = (formData.full_name || user.email)?.slice(0, 2).toUpperCase() || 'U';

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <User className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            โปรไฟล์ของฉัน
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            จัดการข้อมูลส่วนตัวและรูปโปรไฟล์
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              ข้อมูลส่วนตัว
            </CardTitle>
            <CardDescription>
              แก้ไขข้อมูลและรูปโปรไฟล์ของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  {displayAvatar ? (
                    <AvatarImage src={displayAvatar} alt="Avatar" />
                  ) : null}
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded whitespace-nowrap">
                    รอบันทึก
                  </span>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarSelect(file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploading || isSaving}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  เปลี่ยนรูปโปรไฟล์
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  แนะนำขนาด 200x200 พิกเซล
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  ชื่อ-นามสกุล
                </Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="ชื่อของคุณ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  อีเมล
                </Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  อีเมลไม่สามารถเปลี่ยนแปลงได้
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="gap-2 gradient-pink text-primary-foreground"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Profile;
