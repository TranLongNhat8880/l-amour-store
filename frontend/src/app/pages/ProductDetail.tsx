import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { formatPrice } from "../data";
import { Shield, Truck, Heart, ArrowLeft, Star, User } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

const colorMap: Record<string, string> = {
  Black: "bg-black",
  Red: "bg-red-700",
  White: "bg-white",
  Navy: "bg-slate-800",
  Blush: "bg-rose-200",
  Burgundy: "bg-rose-950",
  Pink: "bg-pink-300",
  Nude: "bg-orange-100",
  Beige: "bg-stone-200",
  Blue: "bg-blue-600",
  Purple: "bg-purple-700",
  Green: "bg-emerald-700",
  Brown: "bg-amber-900",
  Gray: "bg-stone-500",
  Grey: "bg-stone-500",
  Đen: "bg-black",
  Đỏ: "bg-red-700",
  "Đỏ đô": "bg-rose-950",
  "Đỏ rượu": "bg-rose-950",
  Trắng: "bg-white",
  Hồng: "bg-pink-300",
  Be: "bg-stone-200",
  Kem: "bg-amber-50",
  Xanh: "bg-blue-600",
  "Xanh dương": "bg-blue-600",
  "Xanh lá": "bg-emerald-600",
  "Xanh navy": "bg-slate-800",
  "Xanh rêu": "bg-emerald-900",
  Tím: "bg-purple-700",
  Nâu: "bg-amber-900",
  Xám: "bg-stone-500",
};

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const navigate = useNavigate();
  const addToCartStore = useCartStore(state => state.addToCart);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();

  const variants = product?.variants || [];

  const toggleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        thumbnail_url: product.thumbnail_url,
        min_price: product.min_price,
        category_name: product.category_name
      });
      toast.success("Đã thêm vào danh sách yêu thích");
    }
  };
  const availableColors = useMemo(() => {
    return Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean))) as string[];
  }, [variants]);
  const availableSizes = useMemo(() => {
    return Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean))) as string[];
  }, [variants]);
  const currentVariant = useMemo(() => {
    return variants.find((v: any) => v.color === selectedColor && v.size === selectedSize);
  }, [variants, selectedColor, selectedSize]);
  const stock = currentVariant ? currentVariant.stock : 0;
  const price = currentVariant ? currentVariant.price : product?.min_price || 0;
  const mainImage = currentVariant?.image_url || product?.thumbnail_url || "https://images.unsplash.com/photo-1668191219162-b58465065deb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res: any = await axiosClient.get(`/products/${id}`);
        setProduct(res.data);
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res: any = await axiosClient.get(`/reviews/${id}`);
        setReviews(res.data);
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  useEffect(() => {
    if (!product || variants.length === 0) return;

    const firstAvailableVariant = variants.find((v: any) => v.stock > 0) || variants[0];
    setSelectedColor(firstAvailableVariant.color || "");
    setSelectedSize(firstAvailableVariant.size || "");
    setQuantity(1);
  }, [product, variants]);

  if (isLoading) {
    return <div className="p-20 text-center text-xl text-stone-500">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return <div className="p-20 text-center text-xl text-rose-800">Không tìm thấy sản phẩm</div>;
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      navigate("/login");
      return;
    }

    if (!currentVariant || stock === 0) return;
    
    addToCartStore({
      variant_id: currentVariant.id,
      product_id: product.id,
      name: product.name,
      size: currentVariant.size,
      color: currentVariant.color,
      price: currentVariant.price,
      quantity: quantity,
      image_url: currentVariant.image_url || product.thumbnail_url,
      stock: currentVariant.stock
    });
    
    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
  };

  if (product.is_age_restricted === 1 && !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 md:p-20 bg-stone-50">
        <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-xl border border-rose-100 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-serif font-bold text-rose-800">18+</span>
          </div>
          <h2 className="text-2xl font-serif text-stone-900 mb-4 uppercase tracking-widest">Nội dung giới hạn</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">Sản phẩm này chứa nội dung nhạy cảm. Bạn cần đăng nhập để xác nhận độ tuổi và xem chi tiết sản phẩm.</p>
          <div className="flex flex-col gap-3">
            <Link to="/login" className="bg-stone-900 text-white py-3 font-bold uppercase tracking-widest hover:bg-rose-800 transition-colors rounded-sm">Đăng nhập ngay</Link>
            <Link to="/shop" className="text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest transition-colors">Quay lại cửa hàng</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <Link to="/shop" className="inline-flex items-center text-sm text-stone-500 hover:text-rose-700 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại cửa hàng
      </Link>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Product Image */}
        <div className="w-full md:w-1/2">
          <div className="aspect-[3/4] bg-stone-100 overflow-hidden rounded-sm relative">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          {product.is_age_restricted === 1 && (
            <span className="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-sm w-max mb-4">
              Giới hạn 18+
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4 mb-4 text-sm text-stone-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-stone-900">{Number(product.rating || 0).toFixed(1)}</span>
              <span>({product.review_count || 0} đánh giá)</span>
            </div>
            <span className="text-stone-300">|</span>
            <span>Đã bán {product.sold_count || 0}</span>
          </div>
          <p className="text-2xl text-rose-800 font-medium mb-6">{formatPrice(price)}</p>
          
          <div className="mb-8">
            <div className={`prose text-stone-600 font-light leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
              <p>{product.description}</p>
            </div>
            {product.description && product.description.length > 150 && (
              <button 
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline uppercase tracking-widest mt-2"
              >
                {isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Color Selection */}
            <div>
              <h3 className="text-sm font-medium text-stone-900 mb-3">Màu sắc: <span className="text-stone-500 font-normal">{selectedColor}</span></h3>
              <div className="flex gap-3">
                {availableColors.map(color => {
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color as string)}
                      className={`w-8 h-8 rounded-full border-2 focus:outline-none transition-all ${
                        selectedColor === color ? 'border-rose-500 ring-2 ring-rose-200 ring-offset-2' : 'border-stone-200 hover:border-stone-400'
                      } ${colorMap[color] || 'bg-gray-500'}`}
                      title={color as string}
                    />
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-sm font-medium text-stone-900">Kích cỡ</h3>
                <button className="text-xs text-stone-500 underline hover:text-rose-700">Hướng dẫn chọn Size</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {availableSizes.map(size => {
                  const variantForSize = (product.variants || []).find((v: any) => v.color === selectedColor && v.size === size);
                  const isAvailable = variantForSize ? variantForSize.stock > 0 : false;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size as string)}
                      disabled={!isAvailable}
                      className={`
                        min-w-[3rem] px-3 py-2 text-sm font-medium rounded-sm border transition-all
                        ${selectedSize === size 
                          ? 'bg-rose-800 text-white border-rose-800' 
                          : isAvailable
                            ? 'bg-white text-stone-700 border-stone-200 hover:border-rose-400'
                            : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                        }
                      `}
                    >
                      {size as string}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock Status */}
            <div className="text-sm">
              {currentVariant ? (
                stock > 0 ? (
                  <span className="text-green-700 font-medium">Còn hàng ({stock} sản phẩm)</span>
                ) : (
                  <span className="text-rose-600 font-medium">Đã hết hàng cho biến thể này</span>
                )
              ) : (
                <span className="text-rose-600 font-medium">Biến thể này không có sẵn</span>
              )}
            </div>

            {/* Actions */}
            <div className="hidden md:flex gap-4 pt-4 border-t border-stone-100">
              <div className="flex border border-stone-200 rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-stone-500 hover:text-rose-700 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  readOnly
                  className="w-12 text-center text-stone-900 font-medium focus:outline-none focus:ring-0 bg-transparent"
                />
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="px-4 py-3 text-stone-500 hover:text-rose-700 transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className={`flex-1 flex justify-center items-center px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors rounded-sm
                  ${stock > 0 ? 'bg-rose-800 hover:bg-rose-700' : 'bg-stone-300 cursor-not-allowed'}
                `}
              >
                Thêm Vào Giỏ
              </button>
              <button 
              onClick={toggleWishlist}
              className={`p-4 border rounded-sm transition-all ${
                isInWishlist(product.id) 
                  ? "bg-rose-50 border-rose-200 text-rose-800" 
                  : "border-stone-200 text-stone-400 hover:text-rose-700 hover:border-rose-200"
              }`}
            >
              <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? "fill-rose-800" : ""}`} />
            </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-10 space-y-4 bg-stone-50 p-6 rounded-sm border border-stone-100">
            <div className="flex items-start gap-4">
              <Shield className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-stone-900">100% Đóng Gói Bảo Mật</h4>
                <p className="text-xs text-stone-500 mt-1">Giao hàng bằng hộp trơn, không in logo. Trên phiếu giao ghi "Phụ kiện thời trang".</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Truck className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-stone-900">Giao Hàng Hỏa Tốc</h4>
                <p className="text-xs text-stone-500 mt-1">Nhận hàng chỉ trong 2-3 ngày làm việc trên toàn quốc.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-2xl z-40 px-4 py-3 flex gap-3">
        <div className="flex border border-stone-200 rounded-sm shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-3 text-stone-500 hover:text-rose-700 text-lg font-bold"
          >
            -
          </button>
          <span className="w-10 flex items-center justify-center text-stone-900 font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            className="px-4 py-3 text-stone-500 hover:text-rose-700 text-lg font-bold"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={stock === 0}
          className={`flex-1 flex justify-center items-center py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors rounded-sm
            ${stock > 0 ? 'bg-rose-800 active:bg-rose-900' : 'bg-stone-300 cursor-not-allowed'}
          `}
        >
          {stock === 0 ? 'Hết hàng' : 'Thêm Vào Giỏ'}
        </button>
        <button
          onClick={toggleWishlist}
          className={`p-3 border rounded-sm shrink-0 transition-all ${
            isInWishlist(product.id)
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "border-stone-200 text-stone-400"
          }`}
        >
          <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-rose-800" : ""}`} />
        </button>
      </div>

      {/* Bottom padding to prevent content hidden behind sticky bar on mobile */}
      <div className="md:hidden h-20" />

      {/* Reviews Section */}
      <div className="mt-24 border-t border-stone-100 pt-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-serif text-stone-900 mb-2">Đánh giá từ khách hàng</h2>
            <div className="flex items-center gap-4">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0) ? 'fill-amber-400' : 'text-stone-200'}`} />
                ))}
              </div>
              <span className="text-sm text-stone-500">{reviews.length} đánh giá</span>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-stone-50 rounded-sm p-12 text-center">
            <p className="text-stone-500 italic">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map(review => (
              <div key={review.id} className="bg-white p-6 rounded-sm border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                      {review.avatar_url ? <img src={review.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{review.full_name}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400' : 'text-stone-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
