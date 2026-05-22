import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../store/authStore";
import axiosClient from "../../api/axiosClient";
import { formatPrice } from "../data";
import { Package, LogOut, User, Calendar, CreditCard, ChevronRight, MapPin, Plus, Trash2, Star, Edit2, X, ShoppingBag, Truck, Tag, Bell, CheckCircle, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "../components/ConfirmModal";
import { AddressSelector } from "../components/AddressSelector";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean | number;
}

type Tab = 'orders' | 'addresses' | 'notifications' | 'sessions';

export function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  // Review state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressMode, setAddressMode] = useState<'old' | 'new'>('new');
  const [addressForm, setAddressForm] = useState({ full_name: "", phone: "", street: "", ward: "", district: "", province: "" });
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Session state
  const [sessions, setSessions] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  useEffect(() => {
    axiosClient.get("/orders/my-orders").then((res: any) => setOrders(res.data)).catch(() => {}).finally(() => setIsLoading(false));
    fetchAddresses();
    fetchNotifications();
    fetchSessions();
  }, []);

  const openOrderDetail = async (order: any) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setIsDetailLoading(true);
    try {
      const res: any = await axiosClient.get(`/orders/${order.id}`);
      setOrderDetail(res.data);
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setIsAddressLoading(true);
    try {
      const res: any = await axiosClient.get("/user/addresses");
      setAddresses(res.data);
    } catch {} finally {
      setIsAddressLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res: any = await axiosClient.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch {}
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const res: any = await axiosClient.get("/sessions");
      setSessions(res.data);
    } catch {
      toast.error("Phiên đăng nhập đã hết hạn hoặc có lỗi xảy ra");
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    // Xóa ngay lập tức trên giao diện (Optimistic Update)
    const oldSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    try {
      await axiosClient.delete(`/sessions/${sessionId}`);
      toast.success("Đã đăng xuất thiết bị thành công");
    } catch {
      toast.error("Thao tác thất bại");
      setSessions(oldSessions); // Hoàn tác nếu lỗi
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await axiosClient.delete("/sessions/others");
      toast.success("Đã đăng xuất tất cả thiết bị khác");
      fetchSessions();
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setAddressMode('new');
    setAddressForm({ full_name: user?.full_name || "", phone: user?.phone || "", street: "", ward: "", district: "", province: "" });
    setIsAddressModalOpen(true);
  };

  const handleEditClick = (addr: Address) => {
    const parts = addr.city.split(', ');
    const isOldMode = parts.length === 3;
    setAddressMode(isOldMode ? 'old' : 'new');
    setEditingAddress(addr);
    setAddressForm({ 
      full_name: addr.full_name, 
      phone: addr.phone, 
      street: addr.address_line, 
      ward: parts[0] || "",
      district: isOldMode ? (parts[1] || "") : "",
      province: isOldMode ? (parts[2] || "") : (parts[1] || "")
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.full_name || !addressForm.phone || !addressForm.street || !addressForm.ward || !addressForm.province || (addressMode === 'old' && !addressForm.district)) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const addressPayload = {
        full_name: addressForm.full_name,
        phone: addressForm.phone,
        address_line: addressForm.street,
        city: addressMode === 'new' 
          ? `${addressForm.ward}, ${addressForm.province}`
          : `${addressForm.ward}, ${addressForm.district}, ${addressForm.province}`
      };

      if (editingAddress) {
        await axiosClient.put(`/user/addresses/${editingAddress.id}`, addressPayload);
        toast.success("Đã cập nhật địa chỉ");
      } else {
        await axiosClient.post("/user/addresses", { ...addressPayload, is_default: addresses.length === 0 });
        toast.success("Thêm địa chỉ thành công!");
      }
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || "Thao tác thất bại");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await axiosClient.patch(`/user/addresses/${id}/set-default`);
      toast.success("Đã đặt làm địa chỉ mặc định");
      fetchAddresses();
    } catch { toast.error("Thao tác thất bại"); }
  };

  const handleDeleteAddress = async () => {
    if (!deleteTarget) return;
    try {
      await axiosClient.delete(`/user/addresses/${deleteTarget.id}`);
      toast.success("Đã xóa địa chỉ");
      fetchAddresses();
    } catch { toast.error("Không thể xóa địa chỉ"); }
  };

  const handleOpenReview = (item: any) => {
    setReviewTarget(item);
    setRating(5);
    setComment("");
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    setIsReviewSubmitting(true);
    try {
      await axiosClient.post("/reviews", {
        product_id: reviewTarget.product_id,
        rating,
        comment
      });
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      setIsReviewModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Không thể gửi đánh giá");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipping': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'shipping': return 'Đang giao hàng';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-72 shrink-0">
            <div className="bg-white p-8 rounded-sm shadow-sm border border-stone-100 text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-serif text-stone-900 mb-1">{user?.full_name}</h2>
              <p className="text-sm text-stone-500 mb-6">{user?.email}</p>
              
              <div className="space-y-1 text-left">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-sm ${activeTab === 'orders' ? 'bg-rose-50 text-rose-800' : 'text-stone-600 hover:bg-stone-50'}`}
                >
                  <Package className="w-4 h-4" /> Đơn hàng của tôi
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-sm ${activeTab === 'addresses' ? 'bg-rose-50 text-rose-800' : 'text-stone-600 hover:bg-stone-50'}`}
                >
                  <MapPin className="w-4 h-4" /> Sổ địa chỉ
                  {addresses.length > 0 && <span className="ml-auto text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">{addresses.length}</span>}
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-sm ${activeTab === 'notifications' ? 'bg-rose-50 text-rose-800' : 'text-stone-600 hover:bg-stone-50'}`}
                >
                  <Bell className="w-4 h-4" /> Thông báo
                  {unreadCount > 0 && <span className="ml-auto text-xs bg-rose-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-sm ${activeTab === 'sessions' ? 'bg-rose-50 text-rose-800' : 'text-stone-600 hover:bg-stone-50'}`}
                >
                  <CreditCard className="w-4 h-4" /> Bảo mật & Thiết bị
                </button>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100">
                <button 
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors rounded-sm"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white p-8 rounded-sm shadow-sm border border-stone-100 min-h-[500px]">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-stone-100">
                  <Package className="w-6 h-6 text-rose-800" />
                  <h1 className="text-2xl font-serif text-stone-900">Lịch sử đơn hàng</h1>
                </div>
                {isLoading ? (
                  <div className="text-center py-20 text-stone-500 italic">Đang tải đơn hàng...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                      <Package className="w-8 h-8" />
                    </div>
                    <p className="text-stone-500 mb-6">Bạn chưa có đơn hàng nào.</p>
                    <Link to="/shop" className="text-rose-700 font-medium hover:underline">Khám phá ngay bộ sưu tập mới</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="border border-stone-100 rounded-sm hover:border-rose-200 transition-colors overflow-hidden group cursor-pointer" onClick={() => openOrderDetail(order)}>
                        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-stone-900 uppercase tracking-wider">#{order.id.substring(0, 8)}</span>
                              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-stone-500">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                              <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {order.is_discreet_shipping ? 'Giao hàng kín đáo' : 'Giao hàng thường'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-stone-400 uppercase tracking-tighter">Tổng tiền</p>
                              <p className="text-lg font-bold text-rose-900">{formatPrice(order.total_amount)}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-rose-700 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white p-8 rounded-sm shadow-sm border border-stone-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-rose-800" />
                    <h1 className="text-2xl font-serif text-stone-900">Sổ Địa Chỉ</h1>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Thêm địa chỉ
                  </button>
                </div>

                {isAddressLoading ? (
                  <div className="text-center py-20 text-stone-400 italic">Đang tải địa chỉ...</div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <p className="text-stone-500 mb-6">Bạn chưa có địa chỉ giao hàng nào.</p>
                    <button onClick={openAddModal} className="text-rose-700 font-medium hover:underline">+ Thêm địa chỉ đầu tiên</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className={`p-5 border rounded-sm transition-all ${addr.is_default ? 'border-rose-300 bg-rose-50/30' : 'border-stone-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-stone-900">{addr.full_name}</p>
                              <span className="text-stone-400">|</span>
                              <p className="text-stone-600 text-sm">{addr.phone}</p>
                              {addr.is_default && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  <Star className="w-2.5 h-2.5" /> Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-stone-600">{addr.address_line}</p>
                            <p className="text-sm text-stone-500">{addr.city}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button onClick={() => handleEditClick(addr)} className="p-2 text-stone-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteTarget(addr)} className="p-2 text-stone-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="mt-3 text-xs text-stone-500 hover:text-rose-700 font-medium transition-colors underline-offset-2 hover:underline"
                          >
                            Đặt làm địa chỉ mặc định
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white p-8 rounded-sm shadow-sm border border-stone-100 min-h-[500px]">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-stone-100">
                  <Bell className="w-6 h-6 text-rose-800" />
                  <h1 className="text-2xl font-serif text-stone-900">Thông báo</h1>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-20 text-stone-400 italic">
                    <Bell className="w-12 h-12 text-stone-100 mx-auto mb-4" />
                    Chưa có thông báo nào dành cho bạn.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-5 border rounded-sm transition-all cursor-pointer ${!notif.is_read ? 'border-rose-200 bg-rose-50/20' : 'border-stone-100 hover:bg-stone-50'}`}
                        onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                      >
                        <div className="flex gap-4">
                          <div className={`mt-1 shrink-0 w-2.5 h-2.5 rounded-full ${!notif.is_read ? 'bg-rose-600 animate-pulse' : 'bg-transparent'}`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className={`text-sm ${!notif.is_read ? 'font-bold text-stone-900' : 'text-stone-700'}`}>{notif.title}</h3>
                              <span className="text-[10px] text-stone-400 uppercase tracking-wider">{new Date(notif.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p className="text-sm text-stone-500 leading-relaxed">{notif.content}</p>
                            {!notif.is_read && (
                               <button className="mt-3 text-[10px] font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" /> Đánh dấu đã đọc
                               </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="bg-white p-8 rounded-sm shadow-sm border border-stone-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-rose-800" />
                    <h1 className="text-2xl font-serif text-stone-900">Thiết bị đang đăng nhập</h1>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleRevokeOthers}
                      className="text-xs font-bold text-rose-700 hover:underline uppercase tracking-widest"
                    >
                      Đăng xuất tất cả thiết bị khác
                    </button>
                  )}
                </div>

                <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                  Đây là danh sách các thiết bị đã đăng nhập vào tài khoản của bạn. Bạn có thể đăng xuất khỏi các thiết bị mà bạn không nhận diện được.
                </p>

                {isSessionsLoading ? (
                  <div className="text-center py-20 text-stone-400 italic">Đang tải danh sách thiết bị...</div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className={`p-5 border rounded-sm flex items-center justify-between ${session.is_current ? 'border-rose-200 bg-rose-50/20' : 'border-stone-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${session.is_current ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500'}`}>
                            {session.user_agent?.toLowerCase().includes('mobile') ? (
                              <Smartphone className="w-6 h-6" />
                            ) : (
                              <Monitor className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-stone-900 text-sm">
                                {session.device_name}
                              </p>
                              {session.is_current && (
                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Thiết bị hiện tại
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              IP: {session.ip_address} • Đăng nhập lúc: {new Date(session.created_at).toLocaleString('vi-VN')}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-1 italic">
                              {session.user_agent}
                            </p>
                          </div>
                        </div>
                        
                        {!session.is_current && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
                            title="Đăng xuất thiết bị này"
                          >
                            <LogOut className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl relative z-10">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">{editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Họ và Tên *</label>
                  <input type="text" value={addressForm.full_name} onChange={e => setAddressForm({...addressForm, full_name: e.target.value})} className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Số điện thoại *</label>
                  <input type="tel" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Hệ thống hành chính *</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="profile_address_mode"
                      value="new"
                      checked={addressMode === 'new'}
                      onChange={() => setAddressMode('new')}
                      className="accent-rose-500"
                    />
                    Mới (34 Tỉnh/Thành)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="profile_address_mode"
                      value="old"
                      checked={addressMode === 'old'}
                      onChange={() => setAddressMode('old')}
                      className="accent-rose-500"
                    />
                    Cũ (63 Tỉnh/Thành)
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Khu vực giao hàng *</label>
                <AddressSelector 
                  mode={addressMode}
                  initialProvince={addressForm.province}
                  initialDistrict={addressForm.district}
                  initialWard={addressForm.ward}
                  onChange={(p, d, w) => setAddressForm(prev => ({...prev, province: p, district: d, ward: w}))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Địa chỉ cụ thể *</label>
                <input type="text" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} placeholder="Số nhà, tên đường..." className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddressModalOpen(false)} className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-medium rounded-sm hover:bg-stone-50">Hủy</button>
                <button type="button" onClick={handleSaveAddress} className="flex-1 py-2.5 bg-stone-900 text-white font-medium rounded-sm hover:bg-stone-800">Lưu địa chỉ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl relative z-10 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Chi tiết đơn hàng</h3>
                <p className="text-xs text-stone-400 uppercase tracking-widest mt-0.5">#{selectedOrder.id.substring(0, 8)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusText(selectedOrder.status)}
                </span>
                <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {isDetailLoading ? (
                <div className="text-center py-20 text-stone-400 italic">Đang tải chi tiết...</div>
              ) : orderDetail ? (
                <div className="space-y-6">
                  {/* Items */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2"><ShoppingBag className="w-3.5 h-3.5" /> Sản phẩm đã đặt</h4>
                    <div className="space-y-3">
                      {orderDetail.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-center p-3 bg-stone-50 rounded-sm">
                          <img src={item.variant_image || item.thumbnail_url || 'https://images.unsplash.com/photo-1668191219162-b58465065deb?w=100&q=80'} alt={item.product_name} className="w-14 h-16 object-cover rounded-sm bg-stone-200" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-stone-900">{item.product_name}</p>
                            <p className="text-xs text-stone-500">{item.color} / {item.size}</p>
                            <p className="text-xs text-stone-500 mt-1">x{item.quantity}</p>
                            {selectedOrder.status === 'completed' && (
                              <button 
                                onClick={() => handleOpenReview(item)}
                                className="mt-2 text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
                              >
                                <Star className="w-3 h-3" /> Viết đánh giá
                              </button>
                            )}
                          </div>
                          <p className="text-sm font-bold text-rose-900">{formatPrice(item.unit_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Shipping Info */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Thông tin giao hàng</h4>
                    <div className="p-4 bg-stone-50 rounded-sm text-sm space-y-1">
                      <p className="font-bold text-stone-900">{orderDetail.shipping_full_name} | {orderDetail.shipping_phone}</p>
                      <p className="text-stone-600">{orderDetail.shipping_address}</p>
                      {orderDetail.is_discreet_shipping && <p className="text-rose-700 font-medium text-xs mt-1">🔒 Giao hàng kín đáo</p>}
                    </div>
                  </div>
                  {/* Price Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Tổng tiền</h4>
                    <div className="p-4 bg-stone-50 rounded-sm space-y-2 text-sm">
                      <div className="flex justify-between text-stone-600"><span>Tạm tính</span><span>{formatPrice(orderDetail.subtotal || orderDetail.total_amount - 35000)}</span></div>
                      <div className="flex justify-between text-stone-600"><span>Phí vận chuyển</span><span>{formatPrice(35000)}</span></div>
                      {orderDetail.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá ({orderDetail.voucher_code})</span><span>-{formatPrice(orderDetail.discount_amount)}</span></div>}
                      <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200"><span>Tổng cộng</span><span className="text-rose-900">{formatPrice(orderDetail.total_amount)}</span></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && reviewTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl relative z-10 p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-serif text-stone-900 mb-2">Đánh giá sản phẩm</h3>
              <p className="text-sm text-stone-500 italic">"{reviewTarget.product_name}"</p>
            </div>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-10 h-10 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">Chia sẻ trải nghiệm của bạn</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Sản phẩm mặc rất thoải mái, chất lượng tuyệt vời..."
                  className="w-full border border-stone-200 p-4 rounded-sm text-sm focus:border-rose-500 outline-none resize-none"
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSubmitReview}
                  disabled={isReviewSubmitting}
                  className="flex-1 py-3 bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-stone-800 disabled:bg-stone-400"
                >
                  {isReviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal 
        isOpen={!!deleteTarget}
        title="Xóa địa chỉ"
        message={`Bạn có chắc chắn muốn xóa địa chỉ "${deleteTarget?.address_line}" không?`}
        onConfirm={handleDeleteAddress}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Xóa"
        type="danger"
      />

      {/* Logout Confirm Modal */}
      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn rời khỏi phiên làm việc này không?"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        confirmText="Đăng xuất ngay"
        cancelText="Ở lại"
        type="danger"
      />
    </div>
  );
}
