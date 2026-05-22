import { X, ShieldCheck, Truck, RotateCcw, Lock } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-sm shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="text-xl font-serif text-stone-900">Điều Khoản & Chính Sách</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Cập nhật lần cuối: Tháng 5, 2026</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-stone-400 hover:text-stone-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-800">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-sm">1. Cam kết độ tuổi</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed pl-11">
              Bằng việc sử dụng dịch vụ tại L'Amour Store, bạn cam kết rằng bạn đã <strong>đủ 18 tuổi</strong>. Các sản phẩm của chúng tôi thuộc danh mục nội y và đồ định hình cao cấp, yêu cầu sự trưởng thành trong nhận thức và sử dụng.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-800">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-sm">2. Chính sách bảo mật & Kín đáo</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed pl-11">
              Chúng tôi hiểu rằng sự riêng tư là ưu tiên hàng đầu. L'Amour cam kết <strong>Giao hàng kín đáo</strong>:
              <br />• Kiện hàng được đóng gói trong hộp trơn, không có nhãn mác thương hiệu bên ngoài.
              <br />• Tên sản phẩm trên vận đơn được thay thế bằng các thuật ngữ chung chung như "Quần áo" hoặc "Phụ kiện".
              <br />• Thông tin khách hàng được bảo mật tuyệt đối, không chia sẻ cho bên thứ ba.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-800">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-sm">3. Chính sách đổi trả</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed pl-11">
              Do đặc thù vệ sinh của ngành hàng nội y:
              <br />• Chỉ chấp nhận đổi trả nếu sản phẩm có <strong>lỗi từ nhà sản xuất</strong> (rách, hỏng khóa, sai mẫu).
              <br />• Sản phẩm phải còn <strong>nguyên tem mác</strong>, chưa qua sử dụng và chưa qua giặt ủi.
              <br />• Thời gian yêu cầu đổi trả trong vòng 48h kể từ khi nhận hàng.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-800">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-sm">4. Vận chuyển & Thanh toán</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed pl-11">
              • Hỗ trợ thanh toán khi nhận hàng (COD) và chuyển khoản ngân hàng.
              <br />• Thời gian giao hàng dự kiến từ 2-4 ngày làm việc tùy khu vực.
              <br />• Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ trở lên.
            </p>
          </section>
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-rose-900 transition-all rounded-sm shadow-lg shadow-stone-200"
          >
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
