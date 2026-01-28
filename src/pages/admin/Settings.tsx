import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, Save, Settings as SettingsIcon, XCircle, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Settings = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading, updateSettings } = useSiteSettings();
  const { uploadImage, isUploading } = useImageUpload();

  const [formData, setFormData] = useState({
    site_name: '',
    description: '',
  });

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when settings load
  useState(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || '',
        description: settings.description || '',
      });
    }
  });

  // Update form when settings change
  if (settings && formData.site_name === '' && settings.site_name) {
    setFormData({
      site_name: settings.site_name,
      description: settings.description || '',
    });
  }

  const handleSave = async () => {
    await updateSettings(formData);
  };

  const handleImageUpload = async (
    file: File,
    type: 'banner' | 'logo' | 'login_background'
  ) => {
    const bucketMap = {
      banner: 'banners' as const,
      logo: 'banners' as const,
      login_background: 'login-backgrounds' as const,
    };

    const { url, error } = await uploadImage(file, bucketMap[type]);
    
    if (!error && url) {
      const fieldMap = {
        banner: 'banner_url',
        logo: 'logo_url',
        login_background: 'login_background_url',
      };
      await updateSettings({ [fieldMap[type]]: url });
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <MainLayout>
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
              <p className="text-muted-foreground">
                กรุณาเข้าสู่ระบบด้วยบัญชี Admin เพื่อตั้งค่า
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            ตั้งค่าเว็บไซต์
          </h1>
          <p className="text-muted-foreground mt-1">
            ปรับแต่งข้อมูลและรูปลักษณ์ของเว็บไซต์
          </p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              ข้อมูลทั่วไป
            </CardTitle>
            <CardDescription>
              ชื่อและรายละเอียดของเว็บไซต์
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">ชื่อเว็บไซต์</Label>
              <Input
                id="siteName"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder="ทีมโสตทัศนศึกษา"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ระบบจัดการงานถ่ายภาพและวิดีโอ"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              รูปภาพ
            </CardTitle>
            <CardDescription>
              โลโก้ แบนเนอร์ และพื้นหลังหน้า Login
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Banner */}
            <div className="space-y-3">
              <Label>แบนเนอร์หน้าแรก</Label>
              {settings?.banner_url && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img
                    src={settings.banner_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'banner');
                }}
              />
              <Button
                variant="outline"
                onClick={() => bannerInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                อัปโหลดแบนเนอร์
              </Button>
            </div>

            {/* Logo */}
            <div className="space-y-3">
              <Label>โลโก้</Label>
              {settings?.logo_url && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border">
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'logo');
                }}
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                อัปโหลดโลโก้
              </Button>
            </div>

            {/* Login Background */}
            <div className="space-y-3">
              <Label>พื้นหลังหน้า Login</Label>
              {settings?.login_background_url && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img
                    src={settings.login_background_url}
                    alt="Login Background"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                ref={loginBgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'login_background');
                }}
              />
              <Button
                variant="outline"
                onClick={() => loginBgInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                อัปโหลดพื้นหลัง Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gradient-pink text-primary-foreground gap-2">
            <Save className="w-4 h-4" />
            บันทึกการตั้งค่า
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
