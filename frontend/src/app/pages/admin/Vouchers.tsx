import { useState, useEffect } from "react";
import axiosClient from "../../../api/axiosClient";
import { formatPrice } from "../../data";
import { Plus, Ticket, Calendar, Trash2, X, Tag, Clock, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Voucher {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  usage_limit: number;
  expiry_date: string;
  created_at: string;
}

export function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percent" as 'fixed' | 'percent',
    discount_value: 0,
    usage_limit: 100,
    expiry_date: ""
  });

  const fetchVouchers = async () => {
    try {
      const res: any = await axiosClient.get("/vouchers");
      setVouchers(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách voucher");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosClient.post("/vouchers", formData);
      toast.success("Tạo mã giảm giá thành công");
      setIsModalOpen(false);
      setFormData({ 
        code: "", 
        discount_type: "percent",
        discount_value: 0, 
        usage_limit: 100, 
        expiry_date: "" 
      });
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo mã");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa mã giảm giá này?")) return;
    try {
      await axiosClient.delete(`/vouchers/${id}`);
      toast.success("Đã xóa mã");
      fetchVouchers();
    } catch (error) {
      toast.error("Không thể xóa mã");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-widest">Quản lý Voucher</h2>
          <p className="text-xs text-stone-500 mt-1">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" /> Tạo mã mới
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-stone-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Mã Voucher</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Loại & Giá trị</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Hạn dùng</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Trạng thái</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-stone-400 italic">Đang tải dữ liệu...</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-stone-400">Chưa có mã giảm giá nào.</td></tr>
            ) : (
              vouchers.map(v => (
                <tr key={v.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-stone-100 rounded-sm flex items-center justify-center text-stone-400">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-stone-900 tracking-[0.1em] uppercase">{v.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-rose-800">
                          {v.discount_type === 'percent' ? `${parseFloat(v.discount_value.toString())}%` : formatPrice(v.discount_value)}
                       </span>
                       <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${v.discount_type === 'percent' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          {v.discount_type === 'percent' ? 'Giảm %' : 'Giảm tiền'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${new Date(v.expiry_date) < new Date() ? 'text-rose-600' : 'text-stone-600'}`}>
                        <Calendar className="w-3.5 h-3.5" /> 
                        {new Date(v.expiry_date).toLocaleDateString('vi-VN')}
                      </div>
                      <span className={`text-[10px] uppercase tracking-tighter ${new Date(v.expiry_date) < new Date() ? 'text-rose-400 font-bold' : 'text-stone-400'}`}>
                        {new Date(v.expiry_date) < new Date() ? 'Đã hết hạn sử dụng' : 'Hết hạn sau 23:59'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${v.usage_limit <= 0 ? 'text-stone-400' : 'text-stone-600'}`}>
                          {v.usage_limit > 0 ? `${v.usage_limit} lượt còn lại` : '0 lượt còn lại'}
                        </span>
                        {v.usage_limit <= 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded-full font-black uppercase">Hết lượt</span>
                        )}
                        {new Date(v.expiry_date) < new Date() && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-full font-black uppercase">Quá hạn</span>
                        )}
                        {v.usage_limit > 0 && new Date(v.expiry_date) >= new Date() && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-black uppercase">Đang chạy</span>
                        )}
                      </div>
                      <div className="w-24 h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${v.usage_limit <= 0 || new Date(v.expiry_date) < new Date() ? 'bg-stone-300' : 'bg-rose-600'}`} 
                          style={{ width: v.usage_limit <= 0 ? '0%' : '60%' }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(v.id)} className="p-2.5 text-stone-200 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all">
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl relative z-10 overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-widest">Tạo mã giảm giá mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Mã voucher *</label>
                  <input required type="text" placeholder="Ví dụ: LAMOUR10" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full border border-stone-200 px-4 py-3 rounded-sm uppercase font-bold tracking-[0.2em] focus:border-rose-500 outline-none transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Loại giảm giá</label>
                    <div className="flex p-1 bg-stone-100 rounded-sm">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, discount_type: 'percent'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-sm transition-all ${formData.discount_type === 'percent' ? 'bg-white text-rose-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                      >
                        <Percent className="w-3.5 h-3.5" /> Giảm %
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, discount_type: 'fixed'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-sm transition-all ${formData.discount_type === 'fixed' ? 'bg-white text-rose-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Giảm tiền
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                      {formData.discount_type === 'percent' ? 'Giá trị % (1-100)' : 'Số tiền giảm (đ)'} *
                    </label>
                    <div className="relative">
                       <input required type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: parseFloat(e.target.value)})} className="w-full border border-stone-200 px-4 py-3 rounded-sm font-bold focus:border-rose-500 outline-none transition-colors" />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">
                          {formData.discount_type === 'percent' ? '%' : 'đ'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Hạn sử dụng *</label>
                    <input required type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full border border-stone-200 px-4 py-3 rounded-sm text-sm focus:border-rose-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Lượt dùng tối đa</label>
                    <input required type="number" value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: parseInt(e.target.value)})} className="w-full border border-stone-200 px-4 py-3 rounded-sm text-sm focus:border-rose-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 border border-stone-200 text-stone-600 font-bold text-xs uppercase tracking-widest hover:bg-stone-50 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 bg-rose-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-rose-900 transition-all shadow-lg disabled:bg-stone-300">
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận tạo mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
