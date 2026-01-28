import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useTelegramGroups } from '@/hooks/useTelegramGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Camera, Save, Settings as SettingsIcon, XCircle, Image as ImageIcon, Upload, Loader2, X, Bell, Plus, Trash2, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Settings = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading, updateSettings, refetch } = useSiteSettings();
  const { uploadImage, isUploading } = useImageUpload();
  const { groups, isLoading: groupsLoading, addGroup, updateGroup, deleteGroup, testNotification } = useTelegramGroups();
  const [isSaving, setIsSaving] = useState(false);

  // Telegram form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupChatId, setNewGroupChatId] = useState('');
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [testingGroupId, setTestingGroupId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    site_name: '',
    description: '',
  });

  // Image previews (for newly selected files before upload)
  const [previews, setPreviews] = useState<{
    banner: string | null;
    logo: string | null;
    login_background: string | null;
  }>({
    banner: null,
    logo: null,
    login_background: null,
  });

  // Pending files to upload
  const [pendingFiles, setPendingFiles] = useState<{
    banner: File | null;
    logo: File | null;
    login_background: File | null;
  }>({
    banner: null,
    logo: null,
    login_background: null,
  });

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || '',
        description: settings.description || '',
      });
    }
  }, [settings]);

  const handleFileSelect = (file: File, type: 'banner' | 'logo' | 'login_background') => {
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [type]: previewUrl }));
    setPendingFiles(prev => ({ ...prev, [type]: file }));
  };

  const clearPreview = (type: 'banner' | 'logo' | 'login_background') => {
    if (previews[type]) {
      URL.revokeObjectURL(previews[type]!);
    }
    setPreviews(prev => ({ ...prev, [type]: null }));
    setPendingFiles(prev => ({ ...prev, [type]: null }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const updates: Record<string, string> = { ...formData };

      // Upload pending images
      const bucketMap = {
        banner: 'banners' as const,
        logo: 'banners' as const,
        login_background: 'login-backgrounds' as const,
      };

      const fieldMap = {
        banner: 'banner_url',
        logo: 'logo_url',
        login_background: 'login_background_url',
      };

      for (const [type, file] of Object.entries(pendingFiles)) {
        if (file) {
          const { url, error } = await uploadImage(file, bucketMap[type as keyof typeof bucketMap]);
          if (!error && url) {
            updates[fieldMap[type as keyof typeof fieldMap]] = url;
          }
        }
      }

      await updateSettings(updates);
      
      // Clear previews after successful save
      Object.keys(previews).forEach(key => {
        if (previews[key as keyof typeof previews]) {
          URL.revokeObjectURL(previews[key as keyof typeof previews]!);
        }
      });
      setPreviews({ banner: null, logo: null, login_background: null });
      setPendingFiles({ banner: null, logo: null, login_background: null });
      
      // Refetch to get updated URLs
      await refetch();
    } finally {
      setIsSaving(false);
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
              {(previews.banner || settings?.banner_url) && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img
                    src={previews.banner || settings?.banner_url || ''}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  {previews.banner && (
                    <button
                      onClick={() => clearPreview('banner')}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {previews.banner && (
                    <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      รอบันทึก
                    </span>
                  )}
                </div>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'banner');
                }}
              />
              <Button
                variant="outline"
                onClick={() => bannerInputRef.current?.click()}
                disabled={isUploading || isSaving}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                เลือกแบนเนอร์
              </Button>
            </div>

            {/* Logo */}
            <div className="space-y-3">
              <Label>โลโก้</Label>
              {(previews.logo || settings?.logo_url) && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img
                    src={previews.logo || settings?.logo_url || ''}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                  {previews.logo && (
                    <button
                      onClick={() => clearPreview('logo')}
                      className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              {previews.logo && (
                <span className="text-xs text-primary font-medium">รอบันทึก</span>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'logo');
                }}
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploading || isSaving}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                เลือกโลโก้
              </Button>
            </div>

            {/* Login Background */}
            <div className="space-y-3">
              <Label>พื้นหลังหน้า Login</Label>
              {(previews.login_background || settings?.login_background_url) && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img
                    src={previews.login_background || settings?.login_background_url || ''}
                    alt="Login Background"
                    className="w-full h-full object-cover"
                  />
                  {previews.login_background && (
                    <button
                      onClick={() => clearPreview('login_background')}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {previews.login_background && (
                    <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      รอบันทึก
                    </span>
                  )}
                </div>
              )}
              <input
                ref={loginBgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'login_background');
                }}
              />
              <Button
                variant="outline"
                onClick={() => loginBgInputRef.current?.click()}
                disabled={isUploading || isSaving}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                เลือกพื้นหลัง Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              การแจ้งเตือน Telegram
            </CardTitle>
            <CardDescription>
              จัดการกลุ่ม Telegram ที่จะได้รับการแจ้งเตือนเมื่อมีงานใหม่
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add new group */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <p className="text-sm font-medium">เพิ่มกลุ่มใหม่</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">ชื่อกลุ่ม</Label>
                  <Input
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="เช่น ทีมช่างภาพ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chatId">Chat ID</Label>
                  <Input
                    id="chatId"
                    value={newGroupChatId}
                    onChange={(e) => setNewGroupChatId(e.target.value)}
                    placeholder="เช่น -1001234567890"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (newGroupName && newGroupChatId) {
                    await addGroup(newGroupName, newGroupChatId);
                    setNewGroupName('');
                    setNewGroupChatId('');
                  }
                }}
                disabled={!newGroupName || !newGroupChatId}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                เพิ่มกลุ่ม
              </Button>
            </div>

            {/* Group list */}
            {groupsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีกลุ่ม Telegram
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {group.chat_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${group.id}`} className="text-sm">
                          เปิดใช้งาน
                        </Label>
                        <Switch
                          id={`active-${group.id}`}
                          checked={group.is_active}
                          onCheckedChange={(checked) => 
                            updateGroup(group.id, { is_active: checked })
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setTestingGroupId(group.id);
                          await testNotification(group.chat_id);
                          setTestingGroupId(null);
                        }}
                        disabled={testingGroupId === group.id}
                        className="gap-1"
                      >
                        {testingGroupId === group.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        ทดสอบ
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteGroupId(group.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              💡 วิธีหา Chat ID: เพิ่ม Bot เข้ากลุ่ม แล้วใช้ @userinfobot หรือ @getmyid_bot
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            className="gradient-pink text-primary-foreground gap-2"
            disabled={isSaving || isUploading}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            บันทึกการตั้งค่า
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบกลุ่ม?</AlertDialogTitle>
              <AlertDialogDescription>
                กลุ่มนี้จะไม่ได้รับการแจ้งเตือนอีกต่อไป
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (deleteGroupId) {
                    await deleteGroup(deleteGroupId);
                    setDeleteGroupId(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Settings;
