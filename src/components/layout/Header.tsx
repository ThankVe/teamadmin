import { useState } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header = ({ onSearch }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Logo & Site Name */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          {settings?.logo_url && (
            <img 
              src={settings.logo_url} 
              alt="Logo" 
              className="w-10 h-10 object-contain"
            />
          )}
          <span className="font-semibold text-foreground hidden sm:block">
            {settings?.site_name || 'โสตทัศนศึกษา'}
          </span>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ค้นหากิจกรรม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-input focus:border-primary focus:ring-primary/20"
            />
          </div>
        </form>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {user ? userInitials : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {user ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">บัญชีผู้ใช้</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    ตั้งค่า
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="text-destructive focus:text-destructive"
                  >
                    ออกจากระบบ
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/login')}>
                  เข้าสู่ระบบ
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
