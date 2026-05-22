import { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "sonner";
import { Layout, Save, Image as ImageIcon, Type, AlignLeft, MousePointer2, RefreshCw } from "lucide-react";

export function AdminSettings() {
  const [hero, setHero] = useState({
    imageUrl: "",
    title: "",
    subtitle: "",
    description: "",
    buttonText: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res: any = await axiosClient.get("/settings/hero");
      if (res.data) {
        setHero(res.data);
        setPreviewUrl(res.data.imageUrl);
      }
    } catch (error) {
      toast.error("Không thể tải cấu hình");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("heroImage", selectedFile);
      }
      formData.append("imageUrl", hero.imageUrl);
      formData.append("title", hero.title);
      formData.append("subtitle", hero.subtitle);
      formData.append("description", hero.description);
      formData.append("buttonText", hero.buttonText);

      await axiosClient.put("/settings/hero", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Đã cập nhật giao diện trang chủ thành công!");
      setSelectedFile(null); // Reset file selection after success
      fetchSettings(); // Refresh to get the new Cloudinary URL
    } catch (error: any) {
      toast.error(error.message || "Cập nhật thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-stone-500 italic">Đang tải cấu hình...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <Layout className="w-6 h-6 text-rose-800" />
          <h1 className="text-2xl font-serif text-stone-900">Quản lý giao diện</h1>
        </div>
        <button 
          onClick={fetchSettings}
          className="p-2 text-stone-400 hover:text-rose-700 transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form chỉnh sửa */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-100">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6 flex items-center gap-2">
            <Type className="w-4 h-4" /> Cấu hình Hero Banner
          </h3>
          
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Tấm bìa (Hero Image) *
              </label>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input 
                    type="file" 
                    id="hero-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <label 
                    htmlFor="hero-upload"
                    className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-stone-200 hover:border-rose-300 hover:bg-rose-50/50 py-8 rounded-sm cursor-pointer transition-all group"
                  >
                    <ImageIcon className="w-5 h-5 text-stone-400 group-hover:text-rose-500" />
                    <span className="text-sm text-stone-500 group-hover:text-rose-700 font-medium">
                      {selectedFile ? selectedFile.name : 'Nhấn để chọn ảnh mới'}
                    </span>
                  </label>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mt-2 italic">Nàng nên dùng ảnh chất lượng cao (1920x1080) để hiển thị đẹp nhất.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1.5">Tiêu đề phụ (Subtitle)</label>
                <input 
                  type="text" 
                  value={hero.subtitle} 
                  onChange={e => setHero({...hero, subtitle: e.target.value})}
                  className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:border-rose-500 outline-none"
                  placeholder="Ví dụ: Bộ Sưu Tập Nửa Đêm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1.5">Tiêu đề chính (Title) *</label>
                <textarea 
                  required
                  rows={2}
                  value={hero.title} 
                  onChange={e => setHero({...hero, title: e.target.value})}
                  className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:border-rose-500 outline-none resize-none"
                  placeholder="Dùng <br /> để xuống dòng"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1.5 flex items-center gap-1">
                <AlignLeft className="w-3 h-3" /> Đoạn mô tả
              </label>
              <textarea 
                rows={3}
                value={hero.description} 
                onChange={e => setHero({...hero, description: e.target.value})}
                className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:border-rose-500 outline-none resize-none"
                placeholder="Giới thiệu ngắn về bộ sưu tập..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1.5 flex items-center gap-1">
                <MousePointer2 className="w-3 h-3" /> Chữ trên nút bấm
              </label>
              <input 
                type="text" 
                value={hero.buttonText} 
                onChange={e => setHero({...hero, buttonText: e.target.value})}
                className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:border-rose-500 outline-none"
                placeholder="Khám Phá Ngay"
              />
            </div>

            <button 
              disabled={isUpdating}
              type="submit"
              className="w-full bg-stone-900 text-white font-bold uppercase tracking-widest text-xs py-3.5 hover:bg-stone-800 transition-all rounded-sm flex items-center justify-center gap-2"
            >
              {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isUpdating ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </form>
        </div>

        {/* Xem trước nhanh */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 px-1">
             Xem trước (Preview)
          </h3>
          <div className="relative aspect-video w-full bg-stone-900 rounded-sm overflow-hidden shadow-md border border-stone-200">
            <div 
              className="absolute inset-0 z-0 opacity-60 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url('${previewUrl || hero.imageUrl || '/hero-bg.jpg'}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 z-10" />
            <div className="relative z-20 h-full flex flex-col items-center justify-center p-6 text-center">
               <span className="text-rose-300 text-[8px] uppercase tracking-widest mb-1">{hero.subtitle}</span>
               <h4 className="text-white font-serif text-lg leading-tight mb-2">
                 {hero.title.split('<br />').map((t, i) => <span key={i}>{t}{i < 1 && <br/>}</span>)}
               </h4>
               <p className="text-stone-200 text-[10px] font-light max-w-[80%] line-clamp-2 mb-3">{hero.description}</p>
               <div className="px-4 py-1.5 bg-rose-800 text-white text-[8px] uppercase tracking-widest font-bold rounded-sm">
                 {hero.buttonText}
               </div>
            </div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-sm">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Lưu ý:</strong> Khi bạn nhấn "Lưu cấu hình", thay đổi sẽ được áp dụng ngay lập tức cho tất cả khách hàng truy cập vào trang chủ. Hãy kiểm tra kỹ URL ảnh trước khi lưu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
