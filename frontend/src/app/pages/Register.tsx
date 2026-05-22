import { useState } from "react";
import { useNavigate, Link } from "react-router";
import axiosClient from "../../api/axiosClient";
import { toast } from "sonner";
import { User, Mail, Lock, Phone, ShieldCheck, ArrowRight, CheckCircle2, ShieldQuestion } from "lucide-react";
import { TermsModal } from "../components/TermsModal";

export function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });

  const [otpCode, setOtpCode] = useState("");

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axiosClient.post("/auth/register", formData);
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại, email có thể đã tồn tại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axiosClient.post("/auth/verify-register", {
        email: formData.email,
        otp_code: otpCode
      });
      toast.success("Kích hoạt tài khoản thành công! Chào mừng bạn.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col lg:flex-row">
      {/* Left side: Hero/Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-rose-950 relative overflow-hidden items-center justify-center p-20">
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548568974-a4f8811a4bd0?w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950 via-rose-950/20 to-transparent"></div>
        
        <div className="relative z-10 max-w-lg text-center">
          <h2 className="text-5xl font-serif text-white mb-6 leading-tight">Chào mừng bạn đến với <br/><span className="italic text-rose-300">L'Amour Store</span></h2>
          <p className="text-rose-100/80 text-lg font-light leading-relaxed mb-10">
            Gia nhập cộng đồng của chúng tôi để nhận những ưu đãi đặc quyền, quản lý đơn hàng dễ dàng và trải nghiệm dịch vụ đóng gói bảo mật tuyệt đối.
          </p>
          <div className="grid grid-cols-2 gap-8 text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-800/50 flex items-center justify-center text-rose-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Bảo mật</h4>
              <p className="text-xs text-rose-200/60">Xác thực OTP giúp tài khoản của bạn an toàn tuyệt đối.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-800/50 flex items-center justify-center text-rose-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Kín đáo</h4>
              <p className="text-xs text-rose-200/60">Giao hàng hộp trơn, che tên sản phẩm nhạy cảm.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 sm:px-12 bg-white">
        <div className="w-full max-w-md">
          {step === 'info' ? (
            <>
              <div className="text-center mb-10">
                 <Link to="/" className="inline-block text-3xl font-serif text-rose-900 tracking-[0.2em] mb-8">L'AMOUR</Link>
                 <h1 className="text-3xl font-serif text-stone-900 mb-2">Tạo Tài Khoản</h1>
                 <p className="text-stone-500 text-sm">Chỉ mất vài bước để bắt đầu hành trình quyến rũ.</p>
              </div>

              <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Họ và Tên *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <input 
                        required 
                        type="text" 
                        value={formData.full_name}
                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                        placeholder="Nguyễn Văn A" 
                        className="w-full border-stone-200 border pl-11 pr-4 py-3 rounded-sm focus:ring-rose-500 focus:border-rose-500 bg-stone-50/50 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Địa chỉ Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <input 
                        required 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="name@example.com" 
                        className="w-full border-stone-200 border pl-11 pr-4 py-3 rounded-sm focus:ring-rose-500 focus:border-rose-500 bg-stone-50/50 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="09xx xxx xxx" 
                        className="w-full border-stone-200 border pl-11 pr-4 py-3 rounded-sm focus:ring-rose-500 focus:border-rose-500 bg-stone-50/50 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Mật khẩu *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <input 
                        required 
                        type="password" 
                        minLength={6}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full border-stone-200 border pl-11 pr-4 py-3 rounded-sm focus:ring-rose-500 focus:border-rose-500 bg-stone-50/50 transition-all outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start pt-2">
                  <input type="checkbox" required className="mt-1 w-4 h-4 text-rose-700 border-stone-300 rounded focus:ring-rose-500" />
                  <span className="ml-3 text-xs text-stone-600 leading-relaxed">
                    Tôi cam kết trên 18 tuổi và đồng ý với các{" "}
                    <button 
                      type="button"
                      onClick={() => setIsTermsOpen(true)}
                      className="text-rose-800 font-semibold hover:underline p-0 m-0 align-baseline"
                    >
                      Điều khoản
                    </button>{" "}
                    của shop.
                  </span>
                </div>

                <button 
                  disabled={isLoading} 
                  type="submit" 
                  className="w-full bg-stone-900 text-white font-bold uppercase tracking-[0.2em] text-xs py-4 hover:bg-stone-800 transition-all rounded-sm mt-4 shadow-xl flex items-center justify-center gap-2 disabled:bg-stone-400"
                >
                  {isLoading ? 'Đang gửi mã...' : 'Tiếp tục nhận mã OTP'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-10">
                 <div className="w-20 h-20 bg-rose-50 text-rose-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldQuestion className="w-10 h-10 animate-pulse" />
                 </div>
                 <h1 className="text-3xl font-serif text-stone-900 mb-2">Xác thực OTP</h1>
                 <p className="text-stone-500 text-sm leading-relaxed px-4">
                    Chúng tôi vừa gửi mã xác thực 6 chữ số đến <br/>
                    <span className="font-bold text-stone-800">{formData.email}</span>
                 </p>
              </div>

              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center mb-4">Nhập mã xác thực của bạn</label>
                  <input 
                    required 
                    type="text" 
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="000000" 
                    className="w-full border-b-2 border-stone-200 px-4 py-4 text-center text-4xl font-black tracking-[0.5em] focus:border-rose-500 outline-none transition-all bg-transparent" 
                  />
                </div>

                <button 
                  disabled={isLoading} 
                  type="submit" 
                  className="w-full bg-rose-800 text-white font-bold uppercase tracking-[0.2em] text-xs py-4 hover:bg-rose-900 transition-all rounded-sm shadow-xl flex items-center justify-center gap-2 disabled:bg-rose-300"
                >
                  {isLoading ? 'Đang xác thực...' : 'Xác nhận & Kích hoạt'}
                  {!isLoading && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="text-center">
                   <button 
                    type="button"
                    onClick={() => setStep('info')}
                    className="text-stone-400 text-xs hover:text-stone-600 transition-colors uppercase tracking-widest font-bold"
                   >
                    Quay lại sửa thông tin
                   </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-10 pt-6 border-t border-stone-100 text-center text-sm text-stone-500">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-rose-800 font-bold hover:underline">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
      
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}
