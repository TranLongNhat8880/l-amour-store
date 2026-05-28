import { Link, useNavigate } from "react-router";
import { formatPrice } from "../data";
import { ShoppingBag, Trash2, Minus, Plus, ChevronRight, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import { useCartStore, CartItem } from "../../store/cartStore";

export function Cart() {
  const navigate = useNavigate();
  const {
    items,
    selectedItemIds,
    removeFromCart,
    updateQuantity,
    toggleSelectItem,
    toggleSelectGroup,
    toggleSelectAll,
    getSelectedTotalPrice
  } = useCartStore();

  const subtotal = getSelectedTotalPrice();
  const shippingCost = 35000;
  const total = subtotal + shippingCost;
  const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;

  // Group items by product_id
  const groupedItems = items.reduce((acc: { [key: string]: CartItem[] }, item) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = [];
    }
    acc[item.product_id].push(item);
    return acc;
  }, {});

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag className="w-10 h-10 text-rose-300" />
        </div>
        <h2 className="text-3xl font-serif text-stone-900 mb-4 tracking-tight">Giỏ hàng của bạn đang trống</h2>
        <p className="text-stone-500 mb-10 max-w-md mx-auto font-light leading-relaxed">
          Có vẻ như bạn chưa chọn được món đồ nào ưng ý. Hãy khám phá những bộ sưu tập quyến rũ nhất của L'Amour nhé.
        </p>
        <Link
          to="/shop"
          className="px-10 py-4 bg-rose-800 text-white font-bold uppercase tracking-widest text-xs hover:bg-rose-700 transition-all rounded-sm shadow-xl shadow-rose-100"
        >
          Khám Phá Ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-20 lg:pb-0">
      {/* Header section */}
      <div className="bg-rose-950 border-b border-rose-900 mb-10 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-100 via-rose-900 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/shop" className="text-rose-200/70 hover:text-rose-100 transition-colors flex items-center gap-1 text-sm font-medium tracking-wide">
              <ArrowLeft className="w-4 h-4" /> Tiếp tục khám phá
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">Giỏ hàng của nàng</h1>
          <p className="text-rose-200/80 mt-3 font-light tracking-wide text-sm">Nàng đang cất giữ {items.length} món đồ quyến rũ trong túi.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-3 px-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded-full border-stone-300 text-rose-900 focus:ring-rose-900 transition-all cursor-pointer accent-rose-900"
              />
              <label htmlFor="selectAll" className="text-stone-700 font-medium cursor-pointer select-none">
                Chọn tất cả ({items.length} sản phẩm)
              </label>
            </div>

            {Object.keys(groupedItems).map((productId) => {
              const productGroup = groupedItems[productId];
              const productName = productGroup[0].name;
              const isGroupSelected = productGroup.every(item => selectedItemIds.includes(item.variant_id));

              return (
                <div key={productId} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden transition-all hover:shadow-md">
                  <div className="bg-stone-50/80 px-4 py-3 border-b border-stone-100 flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={isGroupSelected}
                      onChange={(e) => toggleSelectGroup(productId, e.target.checked)}
                      className="w-4 h-4 rounded-full border-stone-300 text-rose-900 focus:ring-rose-900 transition-all cursor-pointer accent-rose-900"
                    />
                    <h3 className="font-serif text-sm sm:text-lg text-stone-900 line-clamp-1">{productName}</h3>
                  </div>

                  {/* Mobile: 2-column grid | Desktop: 1 column flex row */}
                  <div className="grid grid-cols-2 sm:grid-cols-1 divide-x divide-y sm:divide-x-0 divide-stone-100">
                    {productGroup.map((item) => (
                      <div key={item.variant_id} className="relative animate-in fade-in duration-500 hover:bg-rose-50/30 transition-colors">
                        {/* Checkbox + Delete row */}
                        <div className="absolute top-2 left-2 z-10 flex gap-1">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.variant_id)}
                            onChange={() => toggleSelectItem(item.variant_id)}
                            className="w-4 h-4 border-stone-300 text-rose-900 cursor-pointer accent-rose-900 rounded"
                          />
                        </div>
                        <button
                          onClick={() => removeFromCart(item.variant_id)}
                          className="absolute top-2 right-2 z-10 p-1 text-stone-300 hover:text-rose-600 hover:bg-white rounded-full transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Image */}
                        <div className="aspect-[3/4] bg-stone-100 overflow-hidden">
                          <img
                            src={item.image_url || "https://images.unsplash.com/photo-1668191219162-b58465065deb?w=400&q=80"}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                          />
                        </div>

                        {/* Info */}
                        <div className="p-2 sm:p-3">
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 text-[9px] sm:text-[10px] font-bold uppercase rounded border border-rose-100">{item.color}</span>
                            <span className="px-1.5 py-0.5 bg-stone-100 text-stone-700 text-[9px] sm:text-[10px] font-bold uppercase rounded border border-stone-200">{item.size}</span>
                          </div>
                          <p className="text-sm font-bold text-rose-900">{formatPrice(item.price)}</p>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-stone-200 rounded bg-white overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                                className="px-2 py-1 text-stone-400 hover:text-rose-800 hover:bg-rose-50 transition-colors disabled:opacity-30"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-stone-800">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                                className="px-2 py-1 text-stone-400 hover:text-rose-800 hover:bg-rose-50 transition-colors disabled:opacity-30"
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs font-bold text-stone-700 hidden sm:block">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-stone-700 mt-1 sm:hidden">
                            = {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-sm flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-rose-800 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wider">Cam kết bảo mật</h4>
                  <p className="text-xs text-rose-800/70 mt-1 leading-relaxed">Đơn hàng của bạn sẽ được giao kín đáo, bảo vệ hoàn toàn sự riêng tư của khách hàng.</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-sm flex items-start gap-4">
                <Truck className="w-6 h-6 text-blue-800 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Giao hàng hỏa tốc</h4>
                  <p className="text-xs text-blue-800/70 mt-1 leading-relaxed">Nhận hàng trong vòng 2-3 ngày làm việc. Miễn phí vận chuyển cho đơn từ 500k.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="hidden lg:block w-96 shrink-0">
            <div className="bg-white p-8 rounded-sm shadow-xl border border-stone-100 sticky top-28">
              <h2 className="text-xl font-bold text-stone-900 mb-8 uppercase tracking-widest text-center border-b border-stone-100 pb-4">Thanh toán</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-stone-500 font-light">
                  <span>Tạm tính ({selectedItemIds.length} món)</span>
                  <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500 font-light">
                  <span>Phí vận chuyển dự kiến</span>
                  <span className="font-medium text-stone-900">{subtotal > 0 ? formatPrice(shippingCost) : "0đ"}</span>
                </div>
                {subtotal >= 500000 && (
                  <div className="flex justify-between text-green-600 text-sm italic">
                    <span>Ưu đãi phí vận chuyển</span>
                    <span>-{formatPrice(shippingCost)}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
                  <span className="text-lg font-serif text-stone-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-rose-900">
                    {formatPrice(subtotal > 0 ? (subtotal >= 500000 ? subtotal : total) : 0)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                disabled={selectedItemIds.length === 0}
                className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-4 font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2 transition-all rounded-sm shadow-lg group"
              >
                Tiến hành thanh toán <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="mt-8 pt-8 border-t border-stone-100">
                <p className="text-[10px] text-center text-stone-400 uppercase tracking-widest leading-loose">
                  Chính sách đổi trả trong vòng 7 ngày cho các sản phẩm còn nguyên tem mác. Đảm bảo hài lòng 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-2xl z-40 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-500">{selectedItemIds.length} món • Tổng cộng</span>
          <span className="text-base font-bold text-rose-900">
            {formatPrice(subtotal > 0 ? (subtotal >= 500000 ? subtotal : total) : 0)}
          </span>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          disabled={selectedItemIds.length === 0}
          className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-3.5 font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2 transition-all rounded-sm shadow-lg"
        >
          Tiến hành thanh toán <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
