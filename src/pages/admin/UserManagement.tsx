import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserManagement } from '@/hooks/useUserManagement';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { UsersRound, XCircle, Shield, User, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const UserManagement = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { users, isLoading, updateUserRole } = useUserManagement();
  
  const [avatarPositions, setAvatarPositions] = useState<Record<string, string>>({});
  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    newRole: 'admin' | 'editor' | 'user';
    userName: string;
  } | null>(null);

  // Fetch avatar positions for all users
  useEffect(() => {
    const fetchPositions = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, avatar_position');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { if (p.avatar_position) map[p.user_id] = p.avatar_position; });
        setAvatarPositions(map);
      }
    };
    fetchPositions();
  }, [users]);

  const handleRoleChange = async () => {
    if (pendingChange) {
      await updateUserRole(pendingChange.userId, pendingChange.newRole);
      setPendingChange(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
              <p className="text-muted-foreground">
                เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการบทบาทได้
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <UsersRound className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              จัดการบทบาทผู้ใช้
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              กำหนดบทบาทให้กับผู้ใช้ในระบบ
            </p>
          </div>
          <Badge variant="secondary" className="text-base px-4 py-2 w-fit">
            {users.length} คน
          </Badge>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>บทบาท:</strong> ผู้ดูแลระบบ (Admin) = จัดการได้ทุกอย่าง | ผู้จัดการงาน (Editor) = เพิ่ม/แก้ไขงานได้ | ทีมงาน (User) = ดูงานที่ได้รับมอบหมาย
            </p>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.user_id} className="hover-lift">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar className="w-12 h-12 md:w-14 md:h-14 border-2 border-primary/20">
                    {u.avatar_url ? (
                      <AvatarImage 
                        src={u.avatar_url} 
                        alt={u.full_name || ''} 
                        className="object-cover"
                        style={{ objectPosition: avatarPositions[u.user_id] ? `${avatarPositions[u.user_id].split(',')[0]}% ${avatarPositions[u.user_id].split(',')[1]}%` : '50% 50%' }}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                      {(u.full_name || u.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base md:text-lg truncate">
                      {u.full_name || 'ไม่ระบุชื่อ'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      {u.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-primary" />
                      ) : u.role === 'editor' ? (
                        <Edit className="w-4 h-4 text-blue-500" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Select
                        value={u.role}
                        onValueChange={(value: 'admin' | 'editor' | 'user') => {
                          if (value !== u.role) {
                            setPendingChange({
                              userId: u.user_id,
                              newRole: value,
                              userName: u.full_name || u.email,
                            });
                          }
                        }}
                        disabled={u.user_id === user.id}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              ผู้ดูแลระบบ
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              ผู้จัดการงาน
                            </div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              ทีมงาน
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {u.user_id === user.id && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        คุณ
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <UsersRound className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ยังไม่มีผู้ใช้ในระบบ</p>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={!!pendingChange} onOpenChange={() => setPendingChange(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการเปลี่ยนบทบาท?</AlertDialogTitle>
              <AlertDialogDescription>
                คุณต้องการเปลี่ยนบทบาทของ "{pendingChange?.userName}" เป็น{' '}
                <strong>
                  {pendingChange?.newRole === 'admin' ? 'ผู้ดูแลระบบ' : pendingChange?.newRole === 'editor' ? 'ผู้จัดการงาน' : 'ทีมงาน'}
                </strong>{' '}
                ใช่หรือไม่?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRoleChange}
                className="gradient-pink text-primary-foreground"
              >
                ยืนยัน
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
