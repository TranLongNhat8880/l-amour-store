import { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Globe, 
  User as UserIcon,
  Filter,
  Users,
  X as XIcon,
  Check
} from "lucide-react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'order' | 'promotion' | 'system';
  is_global: number | boolean;
  created_at: string;
  created_by_name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // User Search State
  const [userSearch, setUserSearch] = useState("");
  const [showUserResults, setShowUserResults] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // New Notification State
  const [newNotif, setNewNotif] = useState({
    title: "",
    content: "",
    type: "general",
    is_global: true
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [pagination.page]); // Refetch when page changes

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowUserResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res: any = await axiosClient.get(`/notifications/admin/all?page=${pagination.page}&limit=${pagination.limit}`);
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          total_pages: res.data.pagination.total_pages
        }));
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      toast.error("Không thể tải danh sách thông báo");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res: any = await axiosClient.get("/admin/users");
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotif.title || !newNotif.content) {
      toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung");
      return;
    }

    if (!newNotif.is_global && selectedUsers.length === 0) {
      toast.error("Vui lòng tìm và chọn ít nhất 1 người nhận cho thông báo cá nhân");
      return;
    }

    try {
      await axiosClient.post("/notifications", {
        ...newNotif,
        user_id: selectedUsers.map(u => u.id)
      });
      toast.success(`Đã gửi thông báo đến ${newNotif.is_global ? 'tất cả khách hàng' : selectedUsers.length + ' khách hàng'} thành công`);
      handleCloseModal();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to create notification", error);
      toast.error("Lỗi khi tạo thông báo");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewNotif({ title: "", content: "", type: "general", is_global: true });
    setSelectedUsers([]);
    setUserSearch("");
  };

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
    setUserSearch("");
  };

  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    (u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())) &&
    !selectedUsers.find(selected => selected.id === u.id)
  ).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif italic">Quản lý thông báo</h1>
          <p className="text-stone-500 text-sm">Gửi tin tức, khuyến mãi hoặc cập nhật hệ thống đến khách hàng</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-rose-800 text-white px-6 py-2.5 rounded-sm font-bold hover:bg-rose-700 transition-colors shadow-md uppercase tracking-wider text-xs"
        >
          <Plus className="w-4 h-4" /> Tạo thông báo mới
        </button>
      </div>

      <div className="bg-white rounded-sm border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thông báo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-sm focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Nội dung</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Đối tượng</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Ngày tạo</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-stone-400 italic">Đang tải dữ liệu...</td></tr>
              ) : filteredNotifications.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-stone-400">Chưa có thông báo nào được gửi.</td></tr>
              ) : (
                filteredNotifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full shrink-0 ${
                          notif.type === 'promotion' ? 'bg-amber-50 text-amber-600' :
                          notif.type === 'order' ? 'bg-blue-50 text-blue-600' :
                          notif.type === 'system' ? 'bg-rose-50 text-rose-600' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-sm line-clamp-1">{notif.title}</p>
                          <p className="text-stone-500 text-xs mt-1 line-clamp-2 max-w-md">{notif.content}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {notif.is_global ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          <Globe className="w-3 h-3" /> Tất cả
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                          <UserIcon className="w-3 h-3" /> Cá nhân
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-stone-700 text-xs font-medium">
                          {format(new Date(notif.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {format(new Date(notif.created_at), 'HH:mm', { locale: vi })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-stone-400 hover:text-rose-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between">
            <p className="text-xs text-stone-500">
              Hiển thị <span className="font-bold text-stone-900">{notifications.length}</span> trên <span className="font-bold text-stone-900">{pagination.total}</span> thông báo
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 border border-stone-200 rounded-sm text-xs font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                  className={`w-8 h-8 rounded-sm text-xs font-bold transition-all ${
                    pagination.page === p 
                      ? 'bg-rose-800 text-white shadow-md' 
                      : 'border border-stone-200 text-stone-600 hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 border border-stone-200 rounded-sm text-xs font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-stone-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-serif text-lg tracking-wide uppercase italic">Tạo thông báo mới</h3>
              <button onClick={handleCloseModal} className="text-stone-400 hover:text-white transition-colors">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateNotification} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Tiêu đề thông báo</label>
                  <input 
                    type="text" 
                    value={newNotif.title}
                    onChange={(e) => setNewNotif({...newNotif, title: e.target.value})}
                    placeholder="VD: Chương trình khuyến mãi mùa hè"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Loại thông báo</label>
                    <select 
                      value={newNotif.type}
                      onChange={(e) => setNewNotif({...newNotif, type: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm"
                    >
                      <option value="general">Chung</option>
                      <option value="promotion">Khuyến mãi</option>
                      <option value="order">Đơn hàng</option>
                      <option value="system">Hệ thống</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Đối tượng nhận</label>
                    <div className="flex h-[46px] items-center gap-4 bg-stone-50 border border-stone-200 rounded-sm px-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={newNotif.is_global} 
                          onChange={() => setNewNotif({...newNotif, is_global: true})}
                          className="w-4 h-4 accent-rose-800"
                        />
                        <span className="text-xs text-stone-700 font-medium">Tất cả</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={!newNotif.is_global} 
                          onChange={() => setNewNotif({...newNotif, is_global: false})}
                          className="w-4 h-4 accent-rose-800"
                        />
                        <span className="text-xs text-stone-700 font-medium">Cá nhân</span>
                      </label>
                    </div>
                  </div>
                </div>

                {!newNotif.is_global && (
                  <div className="animate-in slide-in-from-top-2 duration-300 relative" ref={searchRef}>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Tìm kiếm & Chọn nhiều khách hàng</label>
                    
                    {/* Selected Tags */}
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto p-2 border border-rose-100 bg-rose-50/20 rounded-sm">
                        {selectedUsers.map(u => (
                          <div key={u.id} className="flex items-center gap-2 bg-white border border-rose-200 px-2 py-1 rounded-sm shadow-sm">
                            <span className="text-xs font-medium text-stone-800">{u.full_name}</span>
                            <button 
                              type="button" 
                              onClick={() => toggleUserSelection(u)}
                              className="text-rose-400 hover:text-rose-700 transition-colors"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        type="text" 
                        placeholder="Nhập tên hoặc email khách hàng..."
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setShowUserResults(true);
                        }}
                        onFocus={() => setShowUserResults(true)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm"
                      />
                      
                      {showUserResults && userSearch.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-100 shadow-xl rounded-sm z-[70] overflow-hidden">
                          {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-stone-400 italic">Không tìm thấy khách hàng nào hoặc đã được chọn</div>
                          ) : (
                            <div className="divide-y divide-stone-50 max-h-48 overflow-y-auto">
                              {filteredUsers.map(u => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => toggleUserSelection(u)}
                                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-stone-50 transition-colors"
                                >
                                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                                    <UserIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-stone-900">{u.full_name}</p>
                                    <p className="text-[10px] text-stone-500">{u.email}</p>
                                  </div>
                                  <Plus className="w-4 h-4 ml-auto text-stone-300" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Nội dung chi tiết</label>
                  <textarea 
                    rows={4}
                    value={newNotif.content}
                    onChange={(e) => setNewNotif({...newNotif, content: e.target.value})}
                    placeholder="Nhập nội dung thông báo tại đây..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-stone-200 text-stone-600 font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-stone-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-rose-800 text-white font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-rose-700 transition-colors shadow-lg"
                >
                  Gửi thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
