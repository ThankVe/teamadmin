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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvents } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const menuItems = [
  { 
    title: 'หน้าแรก', 
    path: '/', 
    icon: Home,
    requireAuth: false,
  },
  { 
    title: 'กิจกรรมทั้งหมด', 
    path: '/events', 
    icon: Calendar,
    requireAuth: false,
  },
];

const adminMenuItems = [
  { 
    title: 'Dashboard', 
    path: '/admin/dashboard', 
    icon: LayoutDashboard,
    requireAuth: true,
  },
  { 
    title: 'เพิ่มงาน', 
    path: '/admin/add-event', 
    icon: PlusCircle,
    requireAuth: true,
  },
  { 
    title: 'จัดการงาน', 
    path: '/admin/manage-events', 
    icon: Camera,
    requireAuth: true,
  },
  { 
    title: 'ทีมงาน', 
    path: '/admin/team', 
    icon: Users,
    requireAuth: true,
  },
  { 
    title: 'ตั้งค่าเว็บไซต์', 
    path: '/admin/settings', 
    icon: Settings,
    requireAuth: true,
  },
];

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { settings, isAuthenticated, logout } = useEvents();

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
      'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
      collapsed ? 'w-20' : 'w-64'
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center shadow-pink">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-foreground truncate">
                {settings.siteName}
              </h1>
              <p className="text-xs text-muted-foreground">ระบบจัดการงาน</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-card border border-border shadow-md hover:bg-secondary z-10"
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

        {/* Admin Menu */}
        {isAuthenticated && (
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
        {isAuthenticated ? (
          <Button
            variant="ghost"
            onClick={logout}
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
