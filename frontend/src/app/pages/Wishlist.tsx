import { useWishlistStore } from "../../store/wishlistStore";
import { Link } from "react-router";
import { formatPrice } from "../data";
import { Trash2, ShoppingBag, Heart, ArrowRight } from "lucide-react";

export function Wishlist() {
  const { items, removeFromWishlist } = useWishlistStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-rose-50 rounded-full">
          <Heart className="w-8 h-8 text-rose-800 fill-rose-800" />
        </div>
        <div>
          <h1 className="text-4xl font-serif text-stone-900">Danh Mục Yêu Thích</h1>
          <p className="text-stone-500 mt-1">Lưu trữ những sản phẩm bạn yêu thích nhất ({items.length})</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-20 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-stone-200" />
          </div>
          <h2 className="text-2xl font-serif text-stone-900 mb-2">Chưa có sản phẩm yêu thích</h2>
          <p className="text-stone-500 mb-8 max-w-md">Hãy duyệt qua cửa hàng và lưu lại những sản phẩm mà bạn ưng ý nhất.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-rose-800 transition-all group"
          >
            Đến Cửa Hàng <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((product) => (
            <div key={product.id} className="group bg-white rounded-sm border border-stone-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
              <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden">
                <img
                  src={product.thumbnail_url || (product as any).thumbnail || "https://images.unsplash.com/photo-1668191219162-b58465065deb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              <div className="p-5 space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-rose-800 font-bold uppercase tracking-[0.2em]">{product.category_name}</p>
                  <Link to={`/product/${product.id}`} className="block">
                    <h3 className="font-serif text-lg text-stone-900 group-hover:text-rose-800 transition-colors line-clamp-1">{product.name}</h3>
                  </Link>
                  <p className="text-stone-900 font-bold">{formatPrice(product.min_price)}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-grow flex justify-center items-center gap-2 bg-stone-900 text-white py-3 text-[11px] font-bold uppercase tracking-wider hover:bg-rose-800 transition-colors rounded-sm"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    Xem chi tiết
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="p-3 border border-stone-200 text-stone-400 hover:text-rose-700 hover:border-rose-200 transition-all rounded-sm"
                    title="Xóa khỏi danh sách yêu thích"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
