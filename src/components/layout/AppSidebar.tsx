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
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  User,
  UsersRound
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

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
  { title: 'ภาระงานทีม', path: '/admin/team-dashboard', icon: BarChart3 },
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

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isEditor, canManageEvents, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const isMobile = useIsMobile();

  // Hide sidebar on mobile - use MobileMenu instead
  if (isMobile) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const linkContent = (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          'hover:bg-sidebar-accent group',
          active && 'bg-primary text-primary-foreground shadow-pink',
          !active && 'text-sidebar-foreground'
        )}
      >
        <Icon className={cn(
          'w-5 h-5 transition-transform group-hover:scale-110',
          active ? 'text-primary-foreground' : 'text-primary'
        )} />
        {!collapsed && (
          <span className="font-medium">{item.title}</span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-prompt">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside className={cn(
      'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-0',
      collapsed ? 'w-20' : 'w-64'
    )}>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-card border border-border shadow-md hover:bg-secondary z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
        {/* Public Menu */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
              เมนูหลัก
            </p>
          )}
          {menuItems.map(item => (
            <MenuItem key={item.path} item={item} />
          ))}
        </div>

        {/* Team Member Menu - for non-admin users */}
        {user && !isAdmin && (
          <div className="space-y-1 pt-4 mt-4 border-t border-sidebar-border">
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                ทีมงาน
              </p>
            )}
            {teamMemberMenuItems.map(item => (
              <MenuItem key={item.path} item={item} />
            ))}
          </div>
        )}

        {/* Editor Menu - for editor users only */}
        {user && isEditor && !isAdmin && (
          <div className="space-y-1 pt-4 mt-4 border-t border-sidebar-border">
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                จัดการงาน
              </p>
            )}
            {editorMenuItems.map(item => (
              <MenuItem key={item.path} item={item} />
            ))}
          </div>
        )}

        {/* Admin Menu - Show for admin users only */}
        {user && isAdmin && (
          <div className="space-y-1 pt-4 mt-4 border-t border-sidebar-border">
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                ผู้ดูแลระบบ
              </p>
            )}
            {adminMenuItems.map(item => (
              <MenuItem key={item.path} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {user ? (
          <Button
            variant="ghost"
            onClick={signOut}
            className={cn(
              'w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </Button>
        ) : (
          <NavLink to="/login">
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start gap-3',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>เข้าสู่ระบบ</span>}
            </Button>
          </NavLink>
        )}
      </div>
    </aside>
  );
};
