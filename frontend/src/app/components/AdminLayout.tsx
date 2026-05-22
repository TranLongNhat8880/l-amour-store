import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Ticket, 
  LogOut, 
  Store,
  ChevronRight,
  Menu,
  X,
  Tag,
  MessageSquare,
  Bell,
  Layout
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { ConfirmModal } from "./ConfirmModal";
import axiosClient from "../../api/axiosClient";
import { initSocket } from "../../api/socket";

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const menuItems = [
    { name: "Tổng quan", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Sản phẩm", path: "/admin/products", icon: Package },
    { name: "Danh mục", path: "/admin/categories", icon: Tag },
    { 
      name: "Đơn hàng", 
      path: "/admin/orders", 
      icon: ShoppingBag, 
      badge: newOrdersCount > 0 ? newOrdersCount : null,
      badgeColor: "bg-rose-600"
    },
    { name: "Mã giảm giá", path: "/admin/vouchers", icon: Ticket },
    { name: "Khách hàng", path: "/admin/users", icon: Users },
    { name: "Đánh giá", path: "/admin/reviews", icon: MessageSquare },
    { 
      name: "Thông báo", 
      path: "/admin/notifications", 
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
      badgeColor: "bg-amber-500"
    },
    { name: "Giao diện", path: "/admin/settings", icon: Layout },
  ];

  useEffect(() => {
    if (user) {
      fetchCounts();
      
      const socket = initSocket(user.id, user.role);

      // Listen for notification updates
      socket.on("notification", () => {
        fetchCounts();
      });

      // Specifically listen for admin updates (like new orders)
      socket.on("admin_update", () => {
        fetchCounts();
        toast.info("Có cập nhật mới từ hệ thống", {
          description: "Vui lòng kiểm tra mục đơn hàng hoặc thông báo."
        });
      });

      return () => {
        socket.off("notification");
        socket.off("admin_update");
      };
    }
  }, [user]);

  const fetchCounts = async () => {
    try {
      // Fetch new orders
      const statsRes: any = await axiosClient.get("/dashboard/stats");
      setNewOrdersCount(statsRes.data.active_orders || 0);

      // Fetch unread notifications
      const notifRes: any = await axiosClient.get("/notifications");
      setUnreadNotifications(notifRes.data.unread_count || 0);
    } catch (error) {
      console.error("Failed to fetch counts for admin layout", error);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất khỏi trang quản trị");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside 
        className={`bg-white text-stone-900 border-r border-stone-200 w-64 shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-stone-100">
           <h1 className={`font-serif text-2xl tracking-tighter text-rose-900 font-bold ${!isSidebarOpen && "lg:hidden"}`}>L'AMOUR</h1>
           {!isSidebarOpen && <span className="hidden lg:block text-rose-900 font-bold mx-auto text-xl">L'A</span>}
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors relative group ${
                  isActive 
                    ? "bg-rose-700 text-white shadow-md shadow-rose-100" 
                    : "text-stone-800 hover:bg-stone-50 hover:text-rose-700"
                }`}
              >
                <div className="relative">
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-stone-500 group-hover:text-rose-700"}`} />
                  {/* Badge on Icon for small sidebar */}
                  {!isSidebarOpen && item.badge && (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${item.badgeColor}`}></span>
                  )}
                </div>
                
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor}`}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                    {isActive && !item.badge && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </>
                )}

                {/* Tooltip for collapsed sidebar */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-3 py-1 bg-stone-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.name} {item.badge ? `(${item.badge})` : ""}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-4">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 hover:text-rose-700 hover:bg-stone-50 rounded-sm transition-colors group"
          >
            <LogOut className="w-5 h-5 shrink-0 text-stone-400 group-hover:text-rose-700" />
            {isSidebarOpen && <span className="text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-stone-50 rounded-sm"
            >
              <Menu className="w-6 h-6 text-stone-600" />
            </button>
            <div className="h-6 w-px bg-stone-200 mx-2 hidden sm:block"></div>
            <h2 className="text-lg font-serif italic text-stone-800">
              {menuItems.find(i => i.path === location.pathname)?.name || "Bảng điều khiển"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-sm text-stone-500 hover:text-rose-700 font-medium transition-colors">
              <Store className="w-4 h-4" /> Xem cửa hàng
            </Link>
            <div className="flex items-center gap-3 pl-6 border-l border-stone-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-stone-900 leading-tight">{user?.full_name}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em] mt-0.5">Quản trị viên</p>
              </div>
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-800 border border-rose-100 font-bold text-sm">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-stone-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Đăng xuất quản trị"
        message="Mọi phiên làm việc hiện tại của bạn trong bảng điều khiển sẽ kết thúc. Bạn có chắc chắn?"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        confirmText="Xác nhận thoát"
        cancelText="Quay lại"
        type="danger"
      />
    </div>
  );
}
