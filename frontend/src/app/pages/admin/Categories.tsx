import { useState, useEffect } from "react";
import axiosClient from "../../../api/axiosClient";
import { Plus, Edit2, Trash2, Tag, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  is_age_restricted: boolean | number;
  created_at: string;
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
    is_age_restricted: false
  });

  const fetchCategories = async () => {
    try {
      const res: any = await axiosClient.get("/categories");
      setCategories(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
        is_age_restricted: formData.is_age_restricted ? 1 : 0
      };

      if (editingCategory) {
        await axiosClient.put(`/categories/${editingCategory.id}`, payload);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await axiosClient.post("/categories", payload);
        toast.success("Thêm danh mục mới thành công");
      }

      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parent_id: category.parent_id || "",
      is_age_restricted: !!category.is_age_restricted
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa danh mục này có thể ảnh hưởng đến các sản phẩm liên quan. Bạn có chắc chắn?")) return;
    try {
      await axiosClient.delete(`/categories/${id}`);
      toast.success("Đã xóa danh mục");
      fetchCategories();
    } catch (error) {
      toast.error("Không thể xóa danh mục (có thể đang có sản phẩm thuộc danh mục này)");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", parent_id: "", is_age_restricted: false });
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold text-stone-900">Quản lý Danh mục</h2>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-stone-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Tên danh mục</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Giới hạn độ tuổi</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Ngày tạo</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-stone-400 italic">Đang tải...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-stone-400">Chưa có danh mục nào.</td></tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-stone-400" />
                      <div>
                        <p className="text-sm font-bold text-stone-900">{cat.name}</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-tighter">ID: {cat.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {cat.is_age_restricted ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 w-fit">
                        <ShieldAlert className="w-3 h-3" /> 18+
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400 italic">Không</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {new Date(cat.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(cat)} className="p-2 text-stone-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 text-stone-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-sm shadow-xl relative z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">{editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Tên danh mục *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-stone-200 px-4 py-2 outline-none focus:border-rose-500 rounded-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="is_age_restricted"
                  checked={formData.is_age_restricted}
                  onChange={e => setFormData({...formData, is_age_restricted: e.target.checked})}
                  className="w-4 h-4 text-rose-700 border-stone-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="is_age_restricted" className="text-sm font-medium text-stone-700 cursor-pointer">
                  Giới hạn độ tuổi (18+)
                </label>
              </div>
              <p className="text-xs text-stone-500 italic">
                Sản phẩm trong danh mục này sẽ yêu cầu xác nhận độ tuổi khi mua.
              </p>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-600 font-medium rounded-sm hover:bg-stone-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-stone-900 text-white font-medium rounded-sm hover:bg-stone-800 transition-colors disabled:bg-stone-400"
                >
                  {isSubmitting ? "Đang xử lý..." : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
