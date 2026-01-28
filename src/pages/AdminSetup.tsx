import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Lock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminSetup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingAdmin();
  }, []);

  const checkExistingAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setHasAdmin(true);
      }
    } catch (err) {
      console.error('Error checking admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);

    try {
      // Double-check no admin exists
      const { data: existingAdmin } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (existingAdmin && existingAdmin.length > 0) {
        setError('มี Admin ในระบบแล้ว ไม่สามารถสร้างเพิ่มได้');
        setHasAdmin(true);
        return;
      }

      // Sign up user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error('ไม่สามารถสร้างบัญชีได้');
      }

      // Update role to admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', signUpData.user.id);

      if (roleError) throw roleError;

      toast({
        title: 'สร้าง Admin สำเร็จ!',
        description: 'คุณได้รับสิทธิ์ Admin แล้ว กำลังเข้าสู่ระบบ...',
      });

      // Sign in
      await supabase.auth.signInWithPassword({ email, password });

      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>ไม่สามารถเข้าถึงได้</CardTitle>
            <CardDescription>
              หน้านี้ถูกใช้งานแล้ว มี Admin ในระบบแล้ว
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              ไปหน้าเข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">ตั้งค่า Admin</CardTitle>
          <CardDescription>
            สร้างบัญชี Admin คนแรกของระบบ
            <br />
            <span className="text-destructive font-medium">
              ⚠️ หน้านี้จะใช้งานได้เพียงครั้งเดียว
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ชื่อ นามสกุล"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              สร้างบัญชี Admin
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              หลังจากสร้าง Admin แล้ว หน้านี้จะไม่สามารถเข้าถึงได้อีก
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
