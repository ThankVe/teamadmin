import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEvents } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, Settings as SettingsIcon, XCircle, Image as ImageIcon } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings, isAuthenticated } = useEvents();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    siteName: settings.siteName,
    description: settings.description || '',
    logo: settings.logo || '',
    bannerImage: settings.bannerImage || '',
  });

  const handleSave = () => {
    updateSettings(formData);
    toast({
      title: 'บันทึกสำเร็จ',
      description: 'การตั้งค่าถูกบันทึกแล้ว',
    });
  };

  if (!isAuthenticated) {
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
                กรุณาเข้าสู่ระบบเพื่อตั้งค่า
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
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
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
              โลโก้และแบนเนอร์หน้าแรก
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">URL โลโก้</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                ใส่ URL รูปภาพโลโก้ของคุณ
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannerImage">URL แบนเนอร์</Label>
              <Input
                id="bannerImage"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
              <p className="text-xs text-muted-foreground">
                รูปภาพแบนเนอร์ที่แสดงบนหน้าแรก
              </p>
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
