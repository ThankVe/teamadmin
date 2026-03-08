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
import { User, Mail, Save, Upload, Loader2, Camera, Lock, Eye, EyeOff, Move } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AvatarPositioner } from '@/components/profile/AvatarPositioner';

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  avatar_position: string | null;
}

const Profile = () => {
  const { user, isLoading: authLoading, refreshProfile: refreshAuthProfile } = useAuth();
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
  const [avatarPosition, setAvatarPosition] = useState('50,50');
  const [showPositioner, setShowPositioner] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
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
        setAvatarPosition(data.avatar_position || '50,50');
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
    setShowPositioner(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      let avatarUrl = profile?.avatar_url || null;

      // Upload avatar if pending
      if (pendingAvatarFile) {
        const { url, error } = await uploadImage(pendingAvatarFile, 'avatars', user?.id);
        if (!error && url) {
          avatarUrl = url;
        }
      }

      const updates = {
        full_name: formData.full_name || null,
        avatar_url: avatarUrl,
        avatar_position: avatarPosition,
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
      
      // Refresh profile (local + global auth context for header)
      await fetchProfile();
      await refreshAuthProfile();

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

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่าน',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'รหัสผ่านสั้นเกินไป',
        description: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'รหัสผ่านไม่ตรงกัน',
        description: 'กรุณากรอกรหัสผ่านยืนยันให้ตรงกับรหัสผ่านใหม่',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'เปลี่ยนรหัสผ่านสำเร็จ',
        description: 'รหัสผ่านของคุณถูกเปลี่ยนแล้ว',
      });

      // Clear password fields
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
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
  const [posX, posY] = avatarPosition.split(',').map(Number);

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
                <Avatar className="w-32 h-32 border-4 border-primary/20">
                  {displayAvatar ? (
                    <AvatarImage 
                      src={displayAvatar} 
                      alt="Avatar" 
                      className="object-cover" 
                      style={{ objectPosition: `${posX}% ${posY}%` }}
                    />
                  ) : null}
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
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
                {displayAvatar && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPositioner(true)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Move className="w-4 h-4" />
                    ปรับตำแหน่ง
                  </Button>
                )}
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

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              เปลี่ยนรหัสผ่าน
            </CardTitle>
            <CardDescription>
              ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                รหัสผ่านใหม่
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                ยืนยันรหัสผ่านใหม่
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password Match Indicator */}
            {passwordData.newPassword && passwordData.confirmPassword && (
              <p className={`text-sm ${
                passwordData.newPassword === passwordData.confirmPassword 
                  ? 'text-green-600' 
                  : 'text-destructive'
              }`}>
                {passwordData.newPassword === passwordData.confirmPassword 
                  ? '✓ รหัสผ่านตรงกัน' 
                  : '✗ รหัสผ่านไม่ตรงกัน'}
              </p>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                variant="outline"
                className="gap-2"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                เปลี่ยนรหัสผ่าน
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Positioner Dialog */}
      {displayAvatar && (
        <AvatarPositioner
          open={showPositioner}
          onOpenChange={setShowPositioner}
          imageUrl={displayAvatar}
          initialPosition={avatarPosition}
          onConfirm={setAvatarPosition}
        />
      )}
    </MainLayout>
  );
};

export default Profile;
