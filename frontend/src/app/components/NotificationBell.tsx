import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, Clock, Trash2, X } from "lucide-react";
import { Link } from "react-router";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/authStore";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { initSocket } from "../../api/socket";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      const socket = initSocket(user.id, user.role);
      
      socket.on("notification", (newNotif: any) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.info(newNotif.title, {
          description: newNotif.content,
        });
      });

      return () => {
        socket.off("notification");
      };
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isOpen, unreadCount]);

  const fetchNotifications = async () => {
    try {
      const res: any = await axiosClient.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-stone-500 hover:text-rose-700 transition-colors relative flex items-center justify-center"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-sm shadow-xl border border-stone-100 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-stone-50 flex items-center justify-between">
            <h3 className="font-serif text-stone-900 font-medium">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-rose-800 uppercase tracking-widest hover:text-rose-600 transition-colors"
              >
                Đánh dấu đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-400 text-sm italic">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 hover:bg-stone-50 transition-colors cursor-pointer relative group ${!notif.is_read ? 'bg-rose-50/30' : ''}`}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${!notif.is_read ? 'bg-rose-600' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.is_read ? 'font-bold text-stone-900' : 'text-stone-600'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {notif.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-400 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {(() => {
                            try {
                              const d = new Date(notif.created_at);
                              if (isNaN(d.getTime())) return "Vừa xong";
                              return formatDistanceToNow(d, { addSuffix: true, locale: vi });
                            } catch (e) {
                              return "Vừa xong";
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-stone-50 text-center">
             <Link 
               to="/profile" 
               onClick={() => setIsOpen(false)}
               className="text-xs text-stone-400 hover:text-rose-800 transition-colors"
             >
               Xem tất cả trong trang cá nhân
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
