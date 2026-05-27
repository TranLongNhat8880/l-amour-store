import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { formatPrice } from "../data";
import { Filter, ChevronDown, X, Star } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import axiosClient from "../../api/axiosClient";

interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  is_age_restricted?: number | boolean;
  children?: Category[];
}

const flattenCategories = (categories: Category[]): Category[] => {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children || []),
  ]);
};

const getDescendantIds = (category: Category): string[] => [
  category.id,
  ...(category.children || []).flatMap(getDescendantIds),
];

export function Shop() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("q");
  
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number>(3000000); // max price
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 9;

  const colors = ["Đen", "Trắng", "Đỏ", "Hồng", "Tím", "Xanh", "Nude"];
  const sizes = ["S", "M", "L", "XL", "FreeSize", "32B", "34B", "36B"];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await axiosClient.get("/categories");
        setCategories(res.data || []);
      } catch (error) {
        console.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: any = {};
        if (selectedColor) params.color = selectedColor;
        if (selectedSize) params.size = selectedSize;
        if (priceRange < 3000000) params.max_price = priceRange;
        if (searchQuery) params.search = searchQuery;

        const res: any = await axiosClient.get("/products", { params });
        const categoryTree = categories || [];
        const selectedCategory = flattenCategories(categoryTree).find(c => c.id === categoryFilter);
        const allowedCategoryIds = selectedCategory ? getDescendantIds(selectedCategory) : [];
        const nextProducts = categoryFilter
          ? (res.data || []).filter((product: any) => allowedCategoryIds.includes(product.category_id))
          : (res.data || []);

        setProducts(nextProducts);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter, searchQuery, selectedColor, selectedSize, priceRange, categories]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const getCategoryName = (id: string) => {
    const cat = flattenCategories(categories).find(c => c.id === id);
    return cat ? cat.name : "Danh mục";
  };

  const { user } = useAuthStore();
  const selectedCategory = flattenCategories(categories).find(c => c.id === categoryFilter);
  const isRestricted = selectedCategory?.is_age_restricted === 1 || selectedCategory?.is_age_restricted === true;

  const sortedProducts = [...products].sort((a, b) => {
    if (sortOrder === "price_asc") return (a.min_price || 0) - (b.min_price || 0);
    if (sortOrder === "price_desc") return (b.min_price || 0) - (a.min_price || 0);
    // newest: default order from API (already sorted by created_at desc)
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const currentProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFilterCount = [selectedColor, selectedSize, priceRange < 3000000].filter(Boolean).length + (categoryFilter ? 1 : 0);

  // Nội dung bộ lọc (dùng chung cho Sidebar desktop và Drawer mobile)
  const FilterContent = () => (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {categoryFilter && (
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-100 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
            {getCategoryName(categoryFilter)}
            <Link to="/shop" className="hover:text-rose-900" onClick={() => setIsFilterOpen(false)}><X className="w-3 h-3" /></Link>
          </div>
        )}
        {selectedColor && (
          <div className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
            Màu: {selectedColor}
            <button onClick={() => setSelectedColor("")}><X className="w-3 h-3" /></button>
          </div>
        )}
        {selectedSize && (
          <div className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
            Size: {selectedSize}
            <button onClick={() => setSelectedSize("")}><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {/* Color Filter */}
      <div className="border-t border-stone-100 pt-6">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
          Màu Sắc <ChevronDown className="w-4 h-4" />
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {colors.map(color => (
            <label key={color} className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedColor(selectedColor === color ? "" : color)}>
              <div className={`w-4 h-4 rounded-full border transition-all ${selectedColor === color ? 'bg-rose-800 border-rose-800 ring-2 ring-rose-100' : 'border-stone-300 bg-white group-hover:border-rose-400'}`}></div>
              <span className={`text-sm ${selectedColor === color ? 'text-rose-800 font-bold' : 'text-stone-600 group-hover:text-rose-700'}`}>{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div className="border-t border-stone-100 pt-6">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
          Kích Cỡ <ChevronDown className="w-4 h-4" />
        </h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
              className={`min-w-[40px] h-10 px-2 text-[11px] font-bold rounded-sm border transition-all uppercase tracking-tighter ${
                selectedSize === size
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md transform -translate-y-0.5'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-900'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div className="border-t border-stone-100 pt-6">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
          Giá Tối Đa <ChevronDown className="w-4 h-4" />
        </h3>
        <input
          type="range"
          min="100000"
          max="3000000"
          step="100000"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-rose-800 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-sm font-bold text-rose-900 mt-4 text-right">
          {formatPrice(priceRange)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col md:flex-row gap-12">
      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-rose-800" /> Bộ Lọc
                {activeFilterCount > 0 && (
                  <span className="bg-rose-800 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
              </h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <FilterContent />
            </div>
            <div className="px-6 py-4 border-t border-stone-100 shrink-0">
              <button
                onClick={() => { setSelectedColor(""); setSelectedSize(""); setPriceRange(3000000); }}
                className="w-full py-3 border border-stone-200 text-stone-600 text-sm font-bold rounded-sm hover:bg-stone-50 mb-3"
              >
                Xóa tất cả bộ lọc
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3 bg-rose-800 text-white text-sm font-bold rounded-sm hover:bg-rose-900"
              >
                Xem {products.length} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar Filters — Desktop only */}
      <aside className="hidden md:block w-72 shrink-0">
        <h2 className="text-2xl font-serif text-stone-900 mb-6 flex items-center gap-3">
          <Filter className="w-6 h-6 text-rose-800" /> Bộ Lọc
        </h2>
        <FilterContent />
      </aside>

      {/* Main Product Grid */}
      <div className="flex-1 min-w-0">
        {/* Mobile filter button */}
        <div className="flex md:hidden items-center gap-3 mb-4">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 border border-stone-200 bg-white text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm hover:border-rose-400 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="bg-rose-800 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
            className="flex-1 border border-stone-200 bg-white text-xs font-bold uppercase tracking-widest text-stone-600 py-2.5 px-3 focus:outline-none focus:border-rose-400 rounded-sm cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>

        <div className="hidden md:flex justify-between items-end mb-10 border-b border-stone-100 pb-6">
          <div>
            <h1 className="text-3xl font-serif text-stone-900">
              {searchQuery ? `Kết quả cho: "${searchQuery}"` : (categoryFilter ? getCategoryName(categoryFilter) : "Tất Cả Sản Phẩm")}
            </h1>
            <p className="text-sm text-stone-400 mt-2">Tìm thấy {products.length} sản phẩm phù hợp</p>
          </div>
          <div className="flex gap-4 items-center">
            {searchQuery && (
              <Link to="/shop" className="text-xs text-rose-700 hover:underline font-bold uppercase tracking-widest">Xóa tìm kiếm</Link>
            )}
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
              className="border border-stone-200 bg-white text-xs font-bold uppercase tracking-widest text-stone-600 py-3 px-4 focus:outline-none focus:border-rose-400 rounded-sm cursor-pointer transition-colors hover:border-stone-400"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-800 rounded-full animate-spin"></div>
             <p className="text-stone-400 font-medium">Đang tìm kiếm sản phẩm...</p>
          </div>
        ) : isRestricted && !user ? (
          <div className="bg-white rounded-sm border border-rose-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-serif font-bold text-rose-800">18+</span>
            </div>
            <h2 className="text-2xl font-serif text-stone-900 mb-4 uppercase tracking-widest">Nội dung giới hạn</h2>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">Danh mục này chứa các sản phẩm nhạy cảm. Bạn cần đăng nhập để xác nhận độ tuổi và xem danh sách sản phẩm.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/login" className="bg-stone-900 text-white px-10 py-3 font-bold uppercase tracking-widest hover:bg-rose-800 transition-colors rounded-sm text-sm">Đăng nhập</Link>
              <Link to="/register" className="border border-stone-200 text-stone-600 px-10 py-3 font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors rounded-sm text-sm">Đăng ký</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {currentProducts.map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className="group block">
                <div className="relative aspect-[3/4] bg-stone-50 mb-5 overflow-hidden rounded-sm shadow-sm">
                  <img 
                    src={product.thumbnail_url || "https://images.unsplash.com/photo-1668191219162-b58465065deb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"} 
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {product.is_age_restricted === 1 && (
                    <div className="absolute top-3 left-3 bg-rose-900/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 uppercase tracking-[0.2em] rounded-sm shadow-lg">
                      Adult Only
                    </div>
                  )}

                  {product.total_stock === 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-stone-900 text-white text-[10px] font-bold px-4 py-2 uppercase tracking-[0.3em]">Hết hàng</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-center">
                  <p className="text-[10px] text-rose-800 font-bold uppercase tracking-[0.2em]">{product.category_name}</p>
                  <h3 className="font-serif text-lg text-stone-900 group-hover:text-rose-800 transition-colors px-2 line-clamp-1">{product.name}</h3>
                  <p className="text-stone-900 font-bold text-base">{formatPrice(product.min_price || 0)}</p>
                  <div className="flex items-center justify-center gap-3 text-xs text-stone-500 mt-2">
                    {product.review_count > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-stone-700">{Number(product.rating).toFixed(1)}</span>
                        <span>({product.review_count})</span>
                      </div>
                    ) : (
                      <span className="text-[10px] italic">Chưa có đánh giá</span>
                    )}
                    <span className="text-[10px] text-stone-300">|</span>
                    <span>Đã bán {product.sold_count || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
            {products.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-32 bg-stone-50 rounded-sm border border-dashed border-stone-200">
                <Filter className="w-12 h-12 text-stone-200 mb-4" />
                <p className="text-stone-500 font-medium italic">Không tìm thấy sản phẩm phù hợp với bộ lọc này.</p>
                <button 
                  onClick={() => { setSelectedColor(""); setSelectedSize(""); setPriceRange(3000000); }}
                  className="mt-4 text-rose-800 text-xs font-bold uppercase tracking-widest hover:underline"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="col-span-full flex justify-center items-center gap-2 mt-12 pt-8 border-t border-stone-100">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  &larr;
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                        currentPage === i + 1 
                          ? "bg-rose-800 text-white shadow-md" 
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
