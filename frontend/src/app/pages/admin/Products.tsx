import { useState, useEffect, useRef } from "react";
import axiosClient from "../../../api/axiosClient";
import { formatPrice } from "../../data";
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Package, Layers, X, Upload, ChevronRight, Save, Image as ImageIcon, Zap, Camera, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Variant {
  id: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  category_id: string;
  category_name: string;
  min_price: number;
  total_stock: number;
  variants_count: number;
}

interface Category {
  id: string;
  name: string;
}

type VariantImageNotice = {
  type: "success" | "error";
  title: string;
  message: string;
} | null;

const PAGE_SIZE = 10;

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Form states - Product
  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    description: "",
    price: 0,
    stock: 0,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Form states - Variant
  const [variantForm, setVariantForm] = useState({
    size: "",
    color: "",
    price: 0,
    stock: 0,
  });
  const [variantImage, setVariantImage] = useState<File | null>(null);
  const [variantImagePreview, setVariantImagePreview] = useState<string | null>(null);

  // Bulk Variant states
  const [bulkSizes, setBulkSizes] = useState("");
  const [bulkColors, setBulkColors] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const updateVariantFileInputRef = useRef<HTMLInputElement>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingVariantForm, setEditingVariantForm] = useState({
    size: "",
    color: "",
    price: 0,
    stock: 0,
  });
  const [imageTargetVariantId, setImageTargetVariantId] = useState<string | null>(null);
  const [pendingVariantImages, setPendingVariantImages] = useState<Record<string, File>>({});
  const [pendingVariantImagePreviews, setPendingVariantImagePreviews] = useState<Record<string, string>>({});
  const [variantImageNotice, setVariantImageNotice] = useState<VariantImageNotice>(null);
  const pendingVariantImageCount = Object.keys(pendingVariantImages).length;

  const fetchProducts = async () => {
    try {
      const res: any = await axiosClient.get("/products");
      setProducts(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res: any = await axiosClient.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  const fetchVariants = async (productId: string) => {
    try {
      const res: any = await axiosClient.get(`/products/${productId}`);
      setVariants(res.data.variants || []);
    } catch (error) {
      toast.error("Không thể tải biến thể");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVariantImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVariantImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateVariantImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && imageTargetVariantId) {
      const variantId = imageTargetVariantId;
      setPendingVariantImages(prev => ({ ...prev, [variantId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingVariantImagePreviews(prev => ({ ...prev, [variantId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    setImageTargetVariantId(null);
    e.target.value = "";
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProductForm({ name: "", category_id: "", description: "", price: 0, stock: 0 });
    setThumbnail(null);
    setThumbnailPreview(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category_id: product.category_id || "",
      description: product.description || "",
      price: product.min_price || 0,
      stock: product.total_stock || 0
    });
    setThumbnailPreview(product.thumbnail_url);
    setThumbnail(null);
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", productForm.name);
      data.append("category_id", productForm.category_id);
      data.append("description", productForm.description);
      data.append("price", productForm.price.toString());
      data.append("stock", productForm.stock.toString());
      
      if (thumbnail) data.append("thumbnail", thumbnail);

      if (editingProduct) {
        await axiosClient.put(`/products/${editingProduct.id}`, data);
        toast.success("Cập nhật sản phẩm thành công!");
      } else {
        await axiosClient.post("/products", data);
        toast.success("Thêm sản phẩm thành công!");
      }

      setIsProductModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenVariants = (product: Product) => {
    setSelectedProduct(product);
    fetchVariants(product.id);
    setIsVariantModalOpen(true);
    setIsBulkMode(false);
    setPendingVariantImages({});
    setPendingVariantImagePreviews({});
    setImageTargetVariantId(null);
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("size", variantForm.size);
      data.append("color", variantForm.color);
      data.append("price", variantForm.price.toString());
      data.append("stock", variantForm.stock.toString());
      if (variantImage) data.append("image", variantImage);

      await axiosClient.post(`/products/${selectedProduct.id}/variants`, data);

      toast.success("Thêm biến thể thành công");
      setVariantForm({ size: "", color: "", price: 0, stock: 0 });
      setVariantImage(null);
      setVariantImagePreview(null);
      fetchVariants(selectedProduct.id);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi thêm biến thể");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedProduct) return;
    const sizes = bulkSizes.split(",").map(s => s.trim()).filter(s => s);
    const colorsArr = bulkColors.split(",").map(c => c.trim()).filter(c => c);

    if (sizes.length === 0 || colorsArr.length === 0) {
      toast.error("Vui lòng nhập Size và Màu (cách nhau bởi dấu phẩy)");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    try {
      for (const size of sizes) {
        for (const color of colorsArr) {
          await axiosClient.post(`/products/${selectedProduct.id}/variants`, {
            size,
            color,
            price: variantForm.price,
            stock: variantForm.stock
          });
          successCount++;
        }
      }
      toast.success(`Đã sinh ${successCount} biến thể thành công!`);
      setBulkSizes("");
      setBulkColors("");
      setIsBulkMode(false);
      fetchVariants(selectedProduct.id);
      fetchProducts();
    } catch (error: any) {
      toast.error("Có lỗi xảy ra trong quá trình sinh biến thể");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Xác nhận xóa sản phẩm này?")) return;
    try {
      await axiosClient.delete(`/products/${id}`);
      toast.success("Đã xóa sản phẩm");
      fetchProducts();
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Xóa biến thể này?")) return;
    try {
      await axiosClient.delete(`/products/variants/${variantId}`);
      toast.success("Đã xóa biến thể");
      if (selectedProduct) fetchVariants(selectedProduct.id);
      fetchProducts();
    } catch (error) {
      toast.error("Không thể xóa biến thể");
    }
  };

  const handleOpenEditVariant = (variant: Variant) => {
    setEditingVariantId(variant.id);
    setEditingVariantForm({
      size: variant.size || "",
      color: variant.color || "",
      price: Number(variant.price) || 0,
      stock: Number(variant.stock) || 0,
    });
  };

  const handleUpdateVariantDetails = async (variantId: string) => {
    if (!selectedProduct) return;
    if (!editingVariantForm.size.trim() || !editingVariantForm.color.trim()) {
      toast.error("Vui lòng nhập size và màu sắc");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("size", editingVariantForm.size.trim());
      data.append("color", editingVariantForm.color.trim());
      data.append("price", editingVariantForm.price.toString());
      data.append("stock", editingVariantForm.stock.toString());

      await axiosClient.put(`/products/variants/${variantId}`, data);
      toast.success("Đã cập nhật biến thể");
      setEditingVariantId(null);
      fetchVariants(selectedProduct.id);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật biến thể");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEditVariant = () => {
    setEditingVariantId(null);
  };

  const handleSaveAllVariantImages = async () => {
    if (!selectedProduct || pendingVariantImageCount === 0) return;

    setIsSubmitting(true);
    try {
      const savedCount = pendingVariantImageCount;
      for (const [variantId, image] of Object.entries(pendingVariantImages)) {
        const data = new FormData();
        data.append("image", image);
        await axiosClient.put(`/products/variants/${variantId}`, data);
      }

      toast.success(`Đã lưu ${savedCount} ảnh biến thể`);
      setVariantImageNotice({
        type: "success",
        title: "Lưu ảnh thành công",
        message: `Đã cập nhật xong ${savedCount} ảnh biến thể.`,
      });
      setPendingVariantImages({});
      setPendingVariantImagePreviews({});
      fetchVariants(selectedProduct.id);
      fetchProducts();
    } catch (error: any) {
      const message = error.message || "Không thể lưu ảnh biến thể";
      toast.error(message);
      setVariantImageNotice({
        type: "error",
        title: "Lưu ảnh thất bại",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAllVariantImages = () => {
    setPendingVariantImages({});
    setPendingVariantImagePreviews({});
    setImageTargetVariantId(null);
  };

  return (
    <div className="space-y-6">
      {variantImageNotice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/55 px-4">
          <div className={`w-full max-w-md rounded-sm border-2 bg-white p-7 shadow-2xl ${variantImageNotice.type === "success" ? "border-emerald-600" : "border-rose-700"}`}>
            <div className="flex items-start gap-4">
              <div className={`shrink-0 rounded-full p-3 ${variantImageNotice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {variantImageNotice.type === "success" ? (
                  <CheckCircle2 className="h-9 w-9" />
                ) : (
                  <AlertTriangle className="h-9 w-9" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-black uppercase tracking-widest ${variantImageNotice.type === "success" ? "text-emerald-800" : "text-rose-800"}`}>
                  {variantImageNotice.title}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-stone-700">
                  {variantImageNotice.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariantImageNotice(null)}
                className="shrink-0 rounded-sm p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setVariantImageNotice(null)}
              className={`mt-6 w-full py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors ${variantImageNotice.type === "success" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-800 hover:bg-rose-900"}`}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm sản phẩm theo tên..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-sm focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-sm focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm text-stone-700 appearance-none cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-sm font-bold hover:bg-stone-800 transition-colors shadow-md uppercase tracking-wider text-xs"
        >
          <Plus className="w-4 h-4" /> Thêm sản phẩm mới
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-sm shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Sản phẩm</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Danh mục</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Giá & Tồn kho</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {(() => {
                const filtered = products.filter(p => {
                  const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchCat = categoryFilter ? p.category_id === categoryFilter : true;
                  return matchName && matchCat;
                });
                const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                const safePage = Math.min(currentPage, totalPages);
                const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

                if (isLoading) return <tr><td colSpan={4} className="px-6 py-20 text-center text-stone-400 italic">Đang tải dữ liệu...</td></tr>;
                if (filtered.length === 0) return <tr><td colSpan={4} className="px-6 py-20 text-center text-stone-400">Không tìm thấy sản phẩm nào phù hợp.</td></tr>;

                return paginated.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-stone-100 shrink-0 overflow-hidden rounded-sm border border-stone-100 shadow-sm">
                          <img src={product.thumbnail_url || "https://placehold.co/400x600?text=No+Image"} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900 leading-tight">{product.name}</p>
                          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">ID: {product.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-stone-600">
                          {product.category_name}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-rose-900">{product.min_price ? formatPrice(product.min_price) : "Liên hệ"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-stone-500 flex items-center gap-1">
                          <Package className="w-3 h-3" /> {product.total_stock || 0} trong kho
                        </span>
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1 rounded">
                          {product.variants_count || 0} BIẾN THỂ
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenVariants(product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 text-[10px] font-bold rounded-sm hover:bg-stone-200 transition-colors uppercase tracking-wider"
                        >
                          <Layers className="w-3.5 h-3.5" /> Biến thể
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 text-stone-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(() => {
          const filtered = products.filter(p => {
            const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = categoryFilter ? p.category_id === categoryFilter : true;
            return matchName && matchCat;
          });
          const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          if (totalPages <= 1) return null;
          return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100">
              <p className="text-xs text-stone-400">
                Hiển thị <span className="font-bold text-stone-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> trong <span className="font-bold text-stone-700">{filtered.length}</span> sản phẩm
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-sm hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >← Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors ${
                      page === currentPage
                        ? "bg-rose-800 text-white border-rose-800"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >{page}</button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-sm hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >Sau →</button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-sm shadow-xl relative z-10 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-widest">
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitProduct} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Tên sản phẩm *</label>
                    <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="VD: Váy ngủ ren quyến rũ" className="w-full border border-stone-200 px-4 py-2.5 rounded-sm focus:border-rose-500 outline-none transition-colors" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Danh mục *</label>
                    <select required value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})} className="w-full border border-stone-200 px-4 py-2.5 rounded-sm bg-white outline-none focus:border-rose-500 transition-colors">
                      <option value="">Chọn danh mục</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="col-span-2 lg:col-span-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Giá bán (đ) *</label>
                    <input required type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} placeholder="VD: 250000" className="w-full border border-stone-200 px-4 py-2.5 rounded-sm focus:border-rose-500 outline-none transition-colors" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Tồn kho</label>
                    <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})} placeholder="VD: 50" className="w-full border border-stone-200 px-4 py-2.5 rounded-sm focus:border-rose-500 outline-none transition-colors" />
                  </div>
                  {editingProduct && editingProduct.variants_count > 1 && (
                    <p className="col-span-2 text-[10px] text-rose-600 italic">
                      * Lưu ý: Sản phẩm này có nhiều biến thể. Việc sửa đổi tại đây sẽ cập nhật giá/kho cho biến thể đầu tiên.
                    </p>
                  )}

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Ảnh đại diện (Thumbnail) *</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative h-40 w-full border-2 border-dashed border-stone-200 rounded-sm bg-stone-50 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-all overflow-hidden"
                    >
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-contain" alt="Preview" />
                      ) : (
                        <>
                          <ImageIcon className="w-10 h-10 text-stone-300 group-hover:text-rose-400 mb-2 transition-colors" />
                          <p className="text-xs text-stone-400 font-medium">Bấm để chọn hoặc kéo thả ảnh vào đây</p>
                          <p className="text-[10px] text-stone-300 mt-1 uppercase tracking-tighter">PNG, JPG, WebP tối đa 5MB</p>
                        </>
                      )}
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleThumbnailChange} 
                        className="hidden" 
                      />
                      {thumbnailPreview && (
                        <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button type="button" className="bg-white text-stone-900 px-4 py-1.5 rounded-sm text-xs font-bold">Thay đổi ảnh</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Mô tả sản phẩm</label>
                    <textarea rows={4} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="Giới thiệu về chất liệu, kiểu dáng..." className="w-full border border-stone-200 px-4 py-2.5 rounded-sm focus:border-rose-500 outline-none transition-colors resize-none"></textarea>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 border border-stone-200 text-stone-600 font-bold text-xs uppercase tracking-widest hover:bg-stone-50 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-rose-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-rose-900 transition-colors shadow-lg disabled:bg-rose-300">
                  {isSubmitting ? "Đang xử lý..." : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {isVariantModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsVariantModalOpen(false)}></div>
          <div className="bg-white w-full max-w-5xl rounded-sm shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-[0.2em]">Quản lý biến thể</h3>
                <p className="text-xs text-rose-800 font-bold mt-1 uppercase tracking-widest">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setIsVariantModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 flex flex-col lg:flex-row gap-12">
              {/* Add Variant Form */}
              <div className="w-full lg:w-80 shrink-0">
                <div className="bg-white p-8 rounded-sm border border-stone-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-800"></div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest">
                      {isBulkMode ? "Sinh hàng loạt" : "Thêm thủ công"}
                    </h4>
                    <button 
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className="text-[10px] font-bold text-rose-800 hover:underline flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> {isBulkMode ? "Về thủ công" : "Dùng Bulk Mode"}
                    </button>
                  </div>

                  {!isBulkMode ? (
                    <form onSubmit={handleAddVariant} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Size</label>
                        <input required placeholder="S, M, L, XL..." value={variantForm.size} onChange={e => setVariantForm({...variantForm, size: e.target.value})} className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Màu sắc</label>
                        <input required placeholder="Đen, Đỏ, Trắng..." value={variantForm.color} onChange={e => setVariantForm({...variantForm, color: e.target.value})} className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Giá (đ)</label>
                          <input required type="number" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: parseInt(e.target.value)})} className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Kho</label>
                          <input required type="number" value={variantForm.stock} onChange={e => setVariantForm({...variantForm, stock: parseInt(e.target.value)})} className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Ảnh riêng</label>
                        <div 
                          onClick={() => variantFileInputRef.current?.click()}
                          className="group relative h-24 w-full border border-dashed border-stone-200 rounded-sm bg-stone-50 flex items-center justify-center cursor-pointer hover:border-rose-300 transition-all overflow-hidden"
                        >
                          {variantImagePreview ? (
                            <img src={variantImagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <Upload className="w-6 h-6 text-stone-300 group-hover:text-rose-400" />
                          )}
                          <input ref={variantFileInputRef} type="file" accept="image/*" onChange={handleVariantImageChange} className="hidden" />
                        </div>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-stone-900 text-white text-[10px] font-bold rounded-sm hover:bg-stone-800 transition-colors uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> LƯU LẠI
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Danh sách Size</label>
                        <textarea 
                          placeholder="S, M, L, XL..." 
                          value={bulkSizes}
                          onChange={e => setBulkSizes(e.target.value)}
                          className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none h-20 resize-none"
                        />
                        <p className="text-[10px] text-stone-400 mt-1 italic">Cách nhau bởi dấu phẩy</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Danh sách Màu</label>
                        <textarea 
                          placeholder="Đen, Đỏ, Trắng..." 
                          value={bulkColors}
                          onChange={e => setBulkColors(e.target.value)}
                          className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none h-20 resize-none"
                        />
                        <p className="text-[10px] text-stone-400 mt-1 italic">Cách nhau bởi dấu phẩy</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Giá chung</label>
                          <input type="number" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: parseInt(e.target.value)})} className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Kho chung</label>
                          <input type="number" value={variantForm.stock} onChange={e => setVariantForm({...variantForm, stock: parseInt(e.target.value)})} className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none" />
                        </div>
                      </div>
                      <button 
                        onClick={handleBulkGenerate}
                        disabled={isSubmitting} 
                        className="w-full py-3 bg-rose-800 text-white text-[10px] font-bold rounded-sm hover:bg-rose-900 transition-colors uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" /> SINH BIẾN THỂ
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Variants List */}
              <div className="flex-1">
                <div className="mb-6 border-b border-stone-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest">Danh sách biến thể hiện có ({variants.length})</h4>
                  {pendingVariantImageCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest">
                        {pendingVariantImageCount} ảnh chưa lưu
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelAllVariantImages}
                        disabled={isSubmitting}
                        className="px-3 py-2 border border-stone-200 text-stone-600 text-[10px] font-bold rounded-sm hover:bg-stone-50 transition-colors uppercase tracking-widest disabled:opacity-50"
                      >
                        Hủy ảnh
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllVariantImages}
                        disabled={isSubmitting}
                        className="px-3 py-2 bg-stone-900 text-white text-[10px] font-bold rounded-sm hover:bg-stone-800 transition-colors uppercase tracking-widest disabled:bg-stone-300 flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Lưu tất cả ảnh
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <input 
                    ref={updateVariantFileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleUpdateVariantImage}
                  />
                  {variants.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-stone-100 rounded-sm text-stone-300 italic flex flex-col items-center">
                      <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                      <p>Sản phẩm này chưa có biến thể nào</p>
                    </div>
                  ) : (
                    variants.map(v => (
                      <div key={v.id} className="flex items-center gap-6 p-4 border border-stone-100 rounded-sm hover:border-rose-200 hover:shadow-md transition-all group relative">
                        <div 
                          onClick={() => {
                            setImageTargetVariantId(v.id);
                            updateVariantFileInputRef.current?.click();
                          }}
                          className="w-16 h-20 bg-stone-50 shrink-0 overflow-hidden rounded-sm border border-stone-50 shadow-sm relative cursor-pointer group/img"
                        >
                          <img src={pendingVariantImagePreviews[v.id] || v.image_url || selectedProduct.thumbnail_url || "https://placehold.co/400x600?text=No+Image"} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                          <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                          {pendingVariantImages[v.id] && (
                            <span className="absolute bottom-0 left-0 right-0 bg-rose-800 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-widest">
                              Chưa lưu
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          {editingVariantId === v.id ? (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                              <div>
                                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Size</p>
                                <input
                                  value={editingVariantForm.size}
                                  onChange={e => setEditingVariantForm({...editingVariantForm, size: e.target.value})}
                                  className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Màu</p>
                                <input
                                  value={editingVariantForm.color}
                                  onChange={e => setEditingVariantForm({...editingVariantForm, color: e.target.value})}
                                  className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Giá</p>
                                <input
                                  type="number"
                                  value={editingVariantForm.price}
                                  onChange={e => setEditingVariantForm({...editingVariantForm, price: Number(e.target.value)})}
                                  className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Kho</p>
                                <input
                                  type="number"
                                  value={editingVariantForm.stock}
                                  onChange={e => setEditingVariantForm({...editingVariantForm, stock: Number(e.target.value)})}
                                  className="w-full border border-stone-200 px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleUpdateVariantDetails(v.id)}
                                  className="p-2.5 text-white bg-stone-900 hover:bg-stone-800 rounded-sm transition-all disabled:bg-stone-300"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditVariant}
                                  className="p-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-6">
                          <div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Mô tả</p>
                            <p className="text-sm font-bold text-stone-900">{v.size} / {v.color}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Giá bán</p>
                            <p className="text-sm font-bold text-rose-900">{formatPrice(v.price)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Tồn kho</p>
                            <p className="text-sm font-bold text-stone-900">{v.stock}</p>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleOpenEditVariant(v)} className="p-2.5 text-stone-300 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteVariant(v.id)} className="p-2.5 text-stone-200 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all">
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
