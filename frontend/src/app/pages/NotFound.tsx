import { Link, useNavigate } from "react-router";
import { useEffect } from "react";

export function NotFound() {
  const navigate = useNavigate();

  // Auto redirect after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center py-20">
        {/* Decorative number */}
        <div className="relative mb-8 select-none">
          <p className="text-[180px] md:text-[240px] font-serif font-bold text-stone-100 leading-none tracking-tighter">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-rose-800 font-serif italic text-2xl md:text-3xl mb-1">
                Ôi...
              </p>
              <p className="text-stone-500 text-sm font-medium tracking-widest uppercase">
                Trang không tồn tại
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10 max-w-xs mx-auto">
          <div className="flex-1 h-px bg-rose-200" />
          <span className="text-rose-300 text-lg">✦</span>
          <div className="flex-1 h-px bg-rose-200" />
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-serif text-stone-800 mb-4">
          Trang bạn tìm không còn ở đây
        </h1>
        <p className="text-stone-500 leading-relaxed max-w-md mx-auto mb-10 font-light">
          Có thể đường dẫn đã thay đổi hoặc sản phẩm đã được gỡ xuống.
          Bạn sẽ được tự động chuyển về trang chủ sau <span className="font-semibold text-rose-700">10 giây</span>.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-800 text-white text-sm font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors rounded-sm"
          >
            ← Về Trang Chủ
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-stone-300 text-stone-700 text-sm font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors rounded-sm"
          >
            Khám Phá Shop
          </Link>
        </div>

        {/* Subtle brand */}
        <p className="mt-16 text-xs text-stone-300 uppercase tracking-[0.3em] font-medium">
          L'Amour — Thời trang thiết kế cao cấp
        </p>
      </div>
    </div>
  );
}
