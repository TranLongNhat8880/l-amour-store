import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { ShoppingBag, Search, User, Menu, Heart, X, Send, CreditCard, ShieldCheck, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { ScrollToTop } from "./ScrollToTop";
import { NotificationBell } from "./NotificationBell";
import axiosClient from "../../api/axiosClient";
import { toast } from "sonner";
import { AIMuse } from "./AIMuse";
import { TermsModal } from "./TermsModal";

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = useCartStore(state => state.getTotalItems());
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      setSearchQuery("");
    }
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setIsSubscribing(true);
    try {
      const res: any = await axiosClient.post('/newsletter/subscribe', {
        email: newsletterEmail,
        user_id: user?.id
      });
      toast.success(res.message, {
        description: res.data?.coupon ? `Mã giảm giá của bạn: ${res.data.coupon}` : undefined,
        duration: 5000
      });
      setNewsletterEmail("");
    } catch (err: any) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/30 flex flex-col font-sans text-stone-800 selection:bg-rose-200 overflow-x-hidden w-full">
      <ScrollToTop />
      <AIMuse />
      {/* Top Notification Bar */}
      <div className="bg-rose-800 text-rose-50 text-xs py-2 text-center tracking-wider uppercase font-medium">
        Miễn phí giao hàng kín đáo cho đơn từ 500k
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-10 right-10 p-2 text-stone-400 hover:text-stone-900 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <form onSubmit={handleSearch} className="w-full max-w-3xl flex flex-col gap-8">
            <h2 className="text-4xl font-serif text-center text-stone-900">Tìm kiếm sản phẩm</h2>
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-rose-800" />
              <input
                autoFocus
                type="text"
                placeholder="Nhập tên sản phẩm, bộ sưu tập..."
                className="w-full bg-transparent border-b-2 border-stone-200 focus:border-rose-800 py-4 pl-12 text-2xl focus:outline-none transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <p className="text-center text-stone-400 text-sm">Gợi ý: Corset ren, Đồ lót nam, Phụ kiện...</p>
          </form>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 relative">
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden z-10">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-stone-500 hover:text-rose-700 p-2 -ml-2"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none sm:relative sm:inset-auto sm:justify-start sm:w-auto sm:pointer-events-auto">
              <Link to="/" className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                <img src="/assets/logo-final.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                <span className="text-2xl sm:text-3xl font-serif font-semibold tracking-tighter text-rose-900">
                  L'AMOUR
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex space-x-10 items-center h-full">
              <Link to="/shop?category=cat-0002-0000-0000-000000000002" className={`text-sm font-medium tracking-wide ${location.search.includes('cat-0002') ? 'text-rose-700' : 'text-stone-600 hover:text-rose-700'} transition-colors`}>Nội y nữ</Link>
              <Link to="/shop?category=b57092b6-ad85-49ce-809b-8049fd6a5244" className={`text-sm font-medium tracking-wide ${location.search.includes('b57092b6') ? 'text-rose-700' : 'text-stone-600 hover:text-rose-700'} transition-colors`}>Corset</Link>
              <Link to="/shop?category=cat-0001-0000-0000-000000000001" className={`text-sm font-medium tracking-wide ${location.search.includes('cat-0001') ? 'text-rose-700' : 'text-stone-600 hover:text-rose-700'} transition-colors`}>Nội y nam</Link>
              <Link to="/shop?category=cat-0004-0000-0000-000000000004" className={`text-sm font-medium tracking-wide ${location.search.includes('cat-0004') ? 'text-rose-700' : 'text-stone-600 hover:text-rose-700'} transition-colors`}>Phụ kiện</Link>
              {isAdmin && (
                <Link to="/admin/dashboard" className="text-sm font-bold tracking-wide text-rose-800 hover:text-rose-900 transition-colors border-l border-stone-200 pl-4">
                  QUẢN TRỊ
                </Link>
              )}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-3 sm:space-x-5 z-10">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-stone-500 hover:text-rose-700 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link to="/wishlist" className="text-stone-500 hover:text-rose-700 transition-colors hidden sm:block">
                <Heart className="h-5 w-5" />
              </Link>
              <NotificationBell />
              <Link to={user ? "/profile" : "/login"} className="text-stone-500 hover:text-rose-700 transition-colors">
                <User className="h-5 w-5" />
              </Link>
              <Link to="/cart" className="text-stone-500 hover:text-rose-700 transition-colors relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-rose-100">
            <div className="pt-2 pb-4 space-y-1">
              <Link to="/shop?category=cat-0002-0000-0000-000000000002" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-stone-700 hover:text-rose-700 hover:bg-rose-50">Nội y nữ</Link>
              <Link to="/shop?category=b57092b6-ad85-49ce-809b-8049fd6a5244" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-stone-700 hover:text-rose-700 hover:bg-rose-50">Corset</Link>
              <Link to="/shop?category=cat-0001-0000-0000-000000000001" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-stone-700 hover:text-rose-700 hover:bg-rose-50">Nam giới</Link>
              <Link to="/shop?category=cat-0004-0000-0000-000000000004" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-stone-700 hover:text-rose-700 hover:bg-rose-50">Phụ kiện</Link>
              <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-base font-medium text-stone-700 hover:text-rose-700 hover:bg-rose-50">
                <Heart className="w-5 h-5" /> Danh mục yêu thích
              </Link>
              <div className="px-4 py-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm..."
                    className="w-full pl-10 pr-4 py-2 bg-stone-100 border-none rounded-lg text-sm focus:ring-1 focus:ring-rose-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-stone-50 text-stone-600 py-24 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <img src="/assets/logo-final.png" alt="Logo" className="w-10 h-10 object-contain rounded-sm" />
                <span className="text-3xl font-serif font-semibold tracking-tighter text-rose-900 block">
                  L'AMOUR
                </span>
              </div>
              <p className="text-sm leading-relaxed text-stone-500 font-light italic">
                "Gợi cảm, thanh lịch và kín đáo. Trải nghiệm những sản phẩm cao cấp giúp bạn tự tin tỏa sáng mọi lúc mọi nơi."
              </p>
              <div className="mt-8 flex items-center gap-3 text-stone-400">
                <ShieldCheck className="w-5 h-5 text-rose-800" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Cam kết bảo mật 100%</span>
              </div>
            </div>

            <div>
              <h4 className="text-stone-900 font-bold mb-8 tracking-widest uppercase text-xs">Mua Sắm</h4>
              <ul className="space-y-4">
                <li><Link to="/shop" className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors block leading-none">Hàng Mới Về</Link></li>
                <li><Link to="/shop" className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors block leading-none">Bộ Sưu Tập Nữ</Link></li>
                <li><Link to="/shop" className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors block leading-none">Corset & Đồ Định Hình</Link></li>
                <li><Link to="/shop" className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors block leading-none">Bộ Sưu Tập Nam</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-stone-900 font-bold mb-8 tracking-widest uppercase text-xs">HỖ TRỢ KHÁCH HÀNG</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0" />
                  <button className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors bg-transparent border-none p-0 leading-none">
                    Giao Hàng Kín Đáo
                  </button>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 shrink-0"></div>
                  <button className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors bg-transparent border-none p-0 leading-none">
                    Hướng Dẫn Chọn Size
                  </button>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 shrink-0"></div>
                  <button className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors bg-transparent border-none p-0 leading-none">
                    Chính Sách Đổi Trả
                  </button>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 shrink-0"></div>
                  <button className="text-sm text-stone-500 font-light hover:text-rose-800 transition-colors bg-transparent border-none p-0 leading-none">
                    Liên Hệ Với Chúng Tôi
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-stone-900 font-bold mb-8 tracking-widest uppercase text-xs">Tham gia cùng L'Amour</h4>
              <p className="text-sm mb-6 text-stone-500 font-light">Đăng ký để nhận thông báo về bộ sưu tập mới và **mã giảm giá 10%** cho đơn hàng đầu tiên.</p>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    required
                    type="email"
                    placeholder="Địa chỉ Email của bạn"
                    className="bg-white text-stone-900 px-4 py-3.5 w-full focus:outline-none focus:ring-1 focus:ring-rose-800 border border-stone-200 rounded-sm text-sm transition-all placeholder:text-stone-400"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSubscribing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-900 hover:bg-rose-900 text-white p-2 transition-all rounded-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {isSubscribing && <p className="text-[10px] text-rose-700 animate-pulse uppercase tracking-widest font-bold">Đang xử lý...</p>}
              </form>
            </div>
          </div>

          <div className="border-t border-stone-100 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] text-stone-400 flex flex-col gap-2 items-center md:items-start uppercase tracking-widest">
              <p>&copy; 2026 L'Amour Lingerie. Thiết kế bởi sự thanh lịch.</p>
              <div className="flex space-x-6 font-medium">
                <Link to="#" className="hover:text-stone-900 transition-colors">Chính sách bảo mật</Link>
                <button
                  onClick={() => setIsTermsOpen(true)}
                  className="hover:text-stone-900 transition-colors"
                >
                  Điều khoản dịch vụ
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
              <div className="flex gap-4 items-center text-stone-600">
                <CreditCard className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Phương thức thanh toán an toàn</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}
