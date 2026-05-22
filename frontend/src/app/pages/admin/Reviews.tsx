import { useState, useEffect } from "react";
import { Star, Trash2, User, MessageSquare, Package, ExternalLink } from "lucide-react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "sonner";
import { Link } from "react-router";
import { formatPrice } from "../../data";

export function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res: any = await axiosClient.get("/reviews");
      setReviews(res.data || []);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.")) return;

    try {
      await axiosClient.delete(`/reviews/${id}`);
      toast.success("Đã xóa đánh giá thành công");
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete review", error);
      toast.error("Không thể xóa đánh giá");
    }
  };

  const filteredReviews = reviews.filter(review => 
    review.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Quản Lý Đánh Giá</h1>
          <p className="text-stone-500 text-sm mt-1">Xem và kiểm duyệt phản hồi từ khách hàng</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên khách, sản phẩm hoặc nội dung..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-xl border border-stone-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-800 rounded-full animate-spin"></div>
          <p className="text-stone-400 font-medium">Đang tải dữ liệu đánh giá...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 border-dashed p-12 text-center">
              <MessageSquare className="w-12 h-12 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-500 font-medium">Không tìm thấy đánh giá nào phù hợp.</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="lg:w-1/4 flex items-start gap-4">
                      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                        {review.avatar_url ? (
                          <img src={review.avatar_url} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 truncate">{review.full_name}</h4>
                        <p className="text-xs text-stone-500 truncate">{review.user_email}</p>
                        <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">
                          {new Date(review.created_at).toLocaleDateString('vi-VN', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="lg:w-2/4 flex-grow space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-amber-400' : 'text-stone-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {review.rating}/5 sao
                        </span>
                      </div>
                      <p className="text-stone-600 text-sm leading-relaxed italic border-l-2 border-rose-100 pl-4 py-1 bg-rose-50/30 rounded-r-lg">
                        "{review.comment || 'Không có nhận xét.'}"
                      </p>
                    </div>

                    {/* Product & Actions */}
                    <div className="lg:w-1/4 flex flex-col justify-between items-end gap-4">
                      <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-lg w-full">
                        <div className="w-10 h-10 bg-white rounded border border-stone-200 overflow-hidden shrink-0">
                          <img src={review.product_image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Sản phẩm</p>
                          <Link 
                            to={`/product/${review.product_id}`} 
                            target="_blank"
                            className="text-xs font-bold text-stone-800 hover:text-rose-700 truncate block flex items-center gap-1"
                          >
                            {review.product_name}
                            <ExternalLink className="w-2 h-2" />
                          </Link>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(review.id)}
                        className="flex items-center gap-2 text-rose-600 hover:text-white hover:bg-rose-600 px-4 py-2 rounded-lg border border-rose-100 transition-all text-xs font-bold uppercase tracking-wider"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa đánh giá
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
