 import { useState } from 'react';
 import { Search, User } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useNavigate } from 'react-router-dom';
 import { MobileMenu } from './MobileMenu';
 import { NotificationDropdown } from './NotificationDropdown';
 import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header = ({ onSearch }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, isAdmin, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Get display name from profile or fallback to email
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้';
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
        {/* Mobile Menu */}
        <MobileMenu />

        {/* Logo & Site Name */}
        <div 
          className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          {settings?.logo_url && (
            <img 
              src={settings.logo_url} 
              alt="Logo" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
            />
          )}
          <span className="font-semibold text-foreground hidden sm:block text-sm md:text-base">
            {settings?.site_name || 'โสตทัศนศึกษา'}
          </span>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md md:max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isMobile ? "ค้นหา..." : "ค้นหากิจกรรม..."}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 md:pl-10 bg-background border-input focus:border-primary focus:ring-primary/20 h-9 md:h-10 text-sm"
            />
          </div>
        </form>

        {/* Right Side */}
        <div className="flex items-center gap-1 md:gap-2">
         {user && <NotificationDropdown />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 md:h-12 md:w-12 rounded-full p-0">
              <Avatar className="h-10 w-10 md:h-11 md:w-11 border-2 border-primary/20">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />
                )}
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-base">
                  {user ? userInitials : <User className="w-5 h-5" />}
                </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {user ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    โปรไฟล์
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                        ตั้งค่า
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/my-jobs')}>
                      งานของฉัน
                    </DropdownMenuItem>
                  )}
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
