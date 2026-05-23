import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, Package, MapPin, ShoppingBag, ArrowRight } from "lucide-react";
import { useOrderSuccessStore } from "../../store/orderSuccessStore";

export function OrderSuccess() {
  const navigate = useNavigate();
  const { order, clearOrder } = useOrderSuccessStore();

  useEffect(() => {
    // If no order info, redirect to home
    if (!order) {
      navigate("/");
    }
    // Cleanup on unmount
    return () => {
      clearOrder();
    };
  }, [order, navigate, clearOrder]);

  if (!order) return null;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={1.5} />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-green-300 animate-ping opacity-30" />
          </div>

          <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-3">
            Đặt hàng thành công!
          </h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-rose-200" />
            <span className="text-rose-300">✦</span>
            <div className="h-px w-16 bg-rose-200" />
          </div>
          <p className="text-stone-500 font-light leading-relaxed">
            Cảm ơn bạn đã tin tưởng L'Amour. Đơn hàng của bạn đã được ghi nhận và
            đang được chuẩn bị ngay lúc này.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-sm shadow-sm border border-stone-100 overflow-hidden mb-6">
          {/* Order ID */}
          <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-widest">
              Mã đơn hàng
            </span>
            <span className="font-mono text-sm font-bold text-stone-900">
              #{order.orderId}
            </span>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Items summary */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-3 pb-4 border-b border-stone-100">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-14 h-16 bg-stone-100 rounded-sm overflow-hidden shrink-0">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{item.color} / {item.size} × {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shipping info */}
            {order.shippingAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Địa chỉ giao hàng
                  </p>
                  <p className="text-sm text-stone-800">{order.shippingAddress.full_name} | {order.shippingAddress.phone}</p>
                  <p className="text-sm text-stone-500">{order.shippingAddress.address_line}, {order.shippingAddress.city}</p>
                </div>
              </div>
            )}

            {/* Discreet shipping notice */}
            {order.isDiscreet && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-sm p-3">
                <Package className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-0.5">
                    Giao hàng kín đáo đã được bật
                  </p>
                  <p className="text-xs text-rose-700/80">
                    Đơn hàng sẽ được ghi là "Phụ kiện thời trang" trên vận đơn.
                  </p>
                </div>
              </div>
            )}

            {/* Total */}
            {order.total != null && (
              <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                <span className="text-sm text-stone-600">Tổng thanh toán</span>
                <span className="text-base font-bold text-rose-800">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Estimated delivery */}
        <div className="bg-amber-50 border border-amber-100 rounded-sm px-5 py-4 mb-8 flex items-center gap-3">
          <Package className="w-5 h-5 text-amber-700 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Dự kiến giao hàng:</span> Trong vòng 2–3 ngày làm việc.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/profile"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-rose-800 text-white text-sm font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors rounded-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Xem đơn hàng của tôi
          </Link>
          <Link
            to="/shop"
            className="flex-1 flex items-center justify-center gap-2 py-4 border border-stone-300 text-stone-700 text-sm font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors rounded-sm"
          >
            Tiếp tục mua sắm
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-center text-xs text-stone-400 mt-8 tracking-widest uppercase">
          L'Amour — Gợi cảm, thanh lịch và kín đáo
        </p>
      </div>
    </div>
  );
}
