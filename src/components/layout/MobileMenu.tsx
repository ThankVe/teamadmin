import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  PlusCircle, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Camera,
  Users,
  FolderOpen,
  Menu,
  User,
  UsersRound
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const menuItems = [
  { title: 'หน้าแรก', path: '/', icon: Home },
  { title: 'กิจกรรมทั้งหมด', path: '/events', icon: Calendar },
];

const adminMenuItems = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'เพิ่มงาน', path: '/admin/add-event', icon: PlusCircle },
  { title: 'จัดการงาน', path: '/admin/manage-events', icon: Camera },
  { title: 'ประเภทงาน', path: '/admin/categories', icon: FolderOpen },
  { title: 'ทีมงาน', path: '/admin/team', icon: Users },
  { title: 'จัดการบทบาท', path: '/admin/users', icon: UsersRound },
  { title: 'ตั้งค่าเว็บไซต์', path: '/admin/settings', icon: Settings },
];

const editorMenuItems = [
  { title: 'เพิ่มงาน', path: '/admin/add-event', icon: PlusCircle },
  { title: 'จัดการงาน', path: '/admin/manage-events', icon: Camera },
];

const teamMemberMenuItems = [
  { title: 'งานของฉัน', path: '/my-jobs', icon: Camera },
  { title: 'โปรไฟล์', path: '/profile', icon: User },
];

export const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isEditor, canManageEvents, signOut } = useAuth();
  const { settings } = useSiteSettings();

  const isActive = (path: string) => location.pathname === path;

  const MenuItem = ({ item, onClick }: { item: typeof menuItems[0]; onClick: () => void }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <NavLink
        to={item.path}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          'hover:bg-secondary',
          active && 'bg-primary text-primary-foreground',
          !active && 'text-foreground'
        )}
      >
        <Icon className={cn(
          'w-5 h-5',
          active ? 'text-primary-foreground' : 'text-primary'
        )} />
        <span className="font-medium">{item.title}</span>
      </NavLink>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
            )}
            <span>{settings?.site_name || 'โสตทัศนศึกษา'}</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Public Menu */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
              เมนูหลัก
            </p>
            {menuItems.map(item => (
              <MenuItem key={item.path} item={item} onClick={() => setOpen(false)} />
            ))}
          </div>

          {/* Team Member Menu */}
          {user && !isAdmin && (
            <div className="space-y-1 pt-4 mt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                ทีมงาน
              </p>
              {teamMemberMenuItems.map(item => (
                <MenuItem key={item.path} item={item} onClick={() => setOpen(false)} />
              ))}
            </div>
          )}

          {/* Editor Menu */}
          {user && isEditor && !isAdmin && (
            <div className="space-y-1 pt-4 mt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                จัดการงาน
              </p>
              {editorMenuItems.map(item => (
                <MenuItem key={item.path} item={item} onClick={() => setOpen(false)} />
              ))}
            </div>
          )}

          {/* Admin Menu */}
          {user && isAdmin && (
            <div className="space-y-1 pt-4 mt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                ผู้ดูแลระบบ
              </p>
              {adminMenuItems.map(item => (
                <MenuItem key={item.path} item={item} onClick={() => setOpen(false)} />
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t mt-auto">
          {user ? (
            <Button
              variant="ghost"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span>ออกจากระบบ</span>
            </Button>
          ) : (
            <NavLink to="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full justify-start gap-3">
                <LogOut className="w-5 h-5" />
                <span>เข้าสู่ระบบ</span>
              </Button>
            </NavLink>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
