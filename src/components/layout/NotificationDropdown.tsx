 import { useState } from 'react';
 import { Bell, Check, Trash2, Calendar, X } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { useNotifications } from '@/hooks/useNotifications';
 import { useNavigate } from 'react-router-dom';
 import { cn } from '@/lib/utils';
 import { formatThaiDate } from '@/lib/dateUtils';
 
 export const NotificationDropdown = () => {
   const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
   const navigate = useNavigate();
   const [open, setOpen] = useState(false);
 
   const handleNotificationClick = (notification: typeof notifications[0]) => {
     if (!notification.is_read) {
       markAsRead(notification.id);
     }
     if (notification.event_id) {
       navigate(`/event/${notification.event_id}`);
       setOpen(false);
     }
   };
 
   const formatTime = (dateStr: string) => {
     const date = new Date(dateStr);
     const now = new Date();
     const diffMs = now.getTime() - date.getTime();
     const diffMins = Math.floor(diffMs / 60000);
     const diffHours = Math.floor(diffMs / 3600000);
     const diffDays = Math.floor(diffMs / 86400000);
 
     if (diffMins < 1) return 'เมื่อสักครู่';
     if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
     if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
     if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
     return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
   };
 
   return (
     <DropdownMenu open={open} onOpenChange={setOpen}>
       <DropdownMenuTrigger asChild>
         <Button
           variant="ghost"
           size="icon"
           className="relative h-9 w-9 md:h-10 md:w-10"
         >
           <Bell className="w-4 h-4 md:w-5 md:h-5" />
           {unreadCount > 0 && (
             <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
               {unreadCount > 9 ? '9+' : unreadCount}
             </span>
           )}
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent className="w-80 md:w-96" align="end" forceMount>
         <DropdownMenuLabel className="flex items-center justify-between">
           <span className="font-semibold">การแจ้งเตือน</span>
           {unreadCount > 0 && (
             <Button
               variant="ghost"
               size="sm"
               onClick={(e) => {
                 e.preventDefault();
                 markAllAsRead();
               }}
               className="h-7 text-xs text-muted-foreground hover:text-foreground"
             >
               <Check className="w-3 h-3 mr-1" />
               อ่านทั้งหมด
             </Button>
           )}
         </DropdownMenuLabel>
         <DropdownMenuSeparator />
         
         {notifications.length === 0 ? (
           <div className="py-8 text-center text-muted-foreground">
             <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
             <p className="text-sm">ไม่มีการแจ้งเตือน</p>
           </div>
         ) : (
           <ScrollArea className="h-[300px]">
             {notifications.map((notification) => (
               <div
                 key={notification.id}
                 className={cn(
                   "relative p-3 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50",
                   !notification.is_read && "bg-primary/5"
                 )}
                 onClick={() => handleNotificationClick(notification)}
               >
                 <div className="flex items-start gap-3">
                   <div className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                     notification.type === 'job_assigned' ? 'bg-primary/10 text-primary' : 'bg-muted'
                   )}>
                     <Calendar className="w-4 h-4" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-start justify-between gap-2">
                       <p className={cn(
                         "text-sm line-clamp-1",
                         !notification.is_read && "font-semibold"
                       )}>
                         {notification.title}
                       </p>
                       {!notification.is_read && (
                         <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                       )}
                     </div>
                     <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                       {notification.message}
                     </p>
                     <p className="text-xs text-muted-foreground mt-1">
                       {formatTime(notification.created_at)}
                     </p>
                   </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 shrink-0"
                     onClick={(e) => {
                       e.stopPropagation();
                       deleteNotification(notification.id);
                     }}
                   >
                     <X className="w-3 h-3" />
                   </Button>
                 </div>
               </div>
             ))}
           </ScrollArea>
         )}
       </DropdownMenuContent>
     </DropdownMenu>
   );
 };