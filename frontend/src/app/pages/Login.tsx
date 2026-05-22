import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, ShieldQuestion, Eye, EyeOff, CheckCircle2 } from "lucide-react";

type ForgotStep = 'email' | 'otp' | 'reset' | 'done';

const maskEmail = (email: string) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name.substring(0, 2)}***${name.substring(name.length - 2)}@${domain}`;
};

export function Login() {
  const [mode, setMode] = useState<'login' | 'forgot' | 'device_otp'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.login);
  const from = location.state?.from?.pathname || "/";

  // Login state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Device verification state
  const [deviceOtp, setDeviceOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response: any = await axiosClient.post("/auth/login", loginForm);

      // Nếu yêu cầu xác thực thiết bị mới
      if (response.data?.status === "REQUIRE_DEVICE_VERIFICATION") {
        setVerificationEmail(response.data.email);
        setMode('device_otp');
        toast.info("Thiết bị mới cần được xác thực");
        return;
      }

      const { token, user, deviceToken } = response.data;
      if (deviceToken) {
        localStorage.setItem('device_token', deviceToken);
      }
      setAuth(user, token);
      toast.success("Đăng nhập thành công!");
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDeviceOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response: any = await axiosClient.post("/auth/verify-device-otp", {
        email: verificationEmail,
        otp_code: deviceOtp,
        trustDevice: true
      });

      const { token, user, deviceToken } = response.data;
      if (deviceToken) {
        localStorage.setItem('device_token', deviceToken);
      }
      setAuth(user, token);
      toast.success("Xác thực thiết bị thành công!");
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã OTP không chính xác");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axiosClient.post("/auth/forgot-password", { email: forgotEmail });
      setForgotStep('otp');
      toast.success("Mã OTP đã được gửi đến email của bạn");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gửi yêu cầu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }
    setIsLoading(true);
    try {
      await axiosClient.post("/auth/reset-password", {
        email: forgotEmail,
        otp_code: forgotOtp,
        new_password: newPassword
      });
      setForgotStep('done');
      toast.success("Đổi mật khẩu thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 border border-stone-100 shadow-sm rounded-sm">

        {mode === 'login' && (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-serif font-bold text-rose-900 mb-2 tracking-[0.15em] uppercase">L'Amour</h1>
              <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-medium opacity-80">Hành trình của sự quyến rũ</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Địa chỉ Email</label>
                <input required type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full border-stone-300 border px-4 py-2.5 rounded-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white bg-stone-50 text-sm outline-none transition-all duration-200"
                  placeholder="yourname@example.com" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-stone-700">Mật khẩu</label>
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-rose-700 hover:underline">Quên mật khẩu?</button>
                </div>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full border-stone-300 border px-4 py-2.5 rounded-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white bg-stone-50 text-sm outline-none transition-all duration-200"
                  placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button disabled={isLoading} type="submit"
                className="w-full bg-rose-800 text-white font-bold uppercase tracking-wider text-sm py-3.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-900/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 rounded-sm mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </div>
                ) : 'Bắt đầu hành trình'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-50 text-center">
              <p className="text-stone-500 text-xs">Bạn chưa có tài khoản?</p>
              <Link to="/register" className="inline-block mt-2 text-sm font-semibold text-rose-700 hover:underline">
                Đăng ký ngay tại đây
              </Link>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            {forgotStep === 'email' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-serif text-stone-900 mb-2">Quên Mật Khẩu?</h1>
                  <p className="text-stone-500 text-sm">Nhập email để nhận mã khôi phục bí mật.</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Email của bạn</label>
                    <input required type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      className="w-full border-stone-300 border px-4 py-2.5 rounded-sm focus:ring-rose-500 focus:border-rose-500 bg-stone-50 text-sm outline-none"
                      placeholder="yourname@example.com" />
                  </div>
                  <button disabled={isLoading} type="submit"
                    className="w-full bg-rose-800 text-white font-bold uppercase tracking-wider text-sm py-3.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-900/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 rounded-sm">
                    {isLoading ? 'Đang xử lý...' : 'Gửi mã khôi phục'}
                  </button>
                  <button type="button" onClick={() => setMode('login')} className="w-full text-stone-500 text-xs font-semibold hover:underline uppercase tracking-widest">
                    Quay lại đăng nhập
                  </button>
                </form>
              </>
            )}

            {forgotStep === 'otp' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-rose-50 text-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldQuestion className="w-6 h-6 animate-pulse" />
                  </div>
                  <h1 className="text-2xl font-serif text-stone-900 mb-2">Nhập Mã OTP</h1>
                  <p className="text-stone-500 text-xs">Mã 6 chữ số đã được gửi đến <span className="font-bold text-stone-800">{maskEmail(forgotEmail)}</span></p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <input required type="text" maxLength={6} value={forgotOtp} onChange={e => setForgotOtp(e.target.value)}
                    className="w-full border-stone-300 border px-4 py-3 text-center text-3xl font-black tracking-[0.4em] focus:ring-rose-500 focus:border-rose-500 bg-stone-50 rounded-sm outline-none" placeholder="000000" />
                  <button type="submit"
                    className="w-full bg-rose-800 text-white font-bold uppercase tracking-wider text-sm py-3.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-900/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 rounded-sm">
                    Tiếp tục
                  </button>
                  <button type="button" onClick={() => setForgotStep('email')} className="w-full text-stone-500 text-xs font-semibold hover:underline">
                    Thử lại email khác
                  </button>
                </form>
              </>
            )}

            {forgotStep === 'reset' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-serif text-stone-900 mb-2">Mật Khẩu Mới</h1>
                  <p className="text-stone-500 text-sm">Bạn vui lòng chọn mật khẩu mới cho tài khoản.</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Mật khẩu mới</label>
                    <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="w-full border-stone-300 border px-4 py-2.5 rounded-sm focus:ring-rose-500 focus:border-rose-500 bg-stone-50 text-sm outline-none" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Xác nhận mật khẩu</label>
                    <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full border-stone-300 border px-4 py-2.5 rounded-sm focus:ring-rose-500 focus:border-rose-500 bg-stone-50 text-sm outline-none" placeholder="••••••••" />
                  </div>
                  <button disabled={isLoading} type="submit"
                    className="w-full bg-rose-800 text-white font-bold uppercase tracking-wider text-sm py-3.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-900/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 rounded-sm">
                    {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </>
            )}

            {forgotStep === 'done' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-serif text-stone-900 mb-2">Hoàn Tất!</h1>
                <p className="text-stone-500 text-sm mb-8 px-2">Mật khẩu đã được cập nhật thành công. Bạn có thể đăng nhập ngay.</p>
                <button type="button" onClick={() => setMode('login')}
                  className="w-full bg-rose-800 text-white font-bold uppercase tracking-wider text-sm py-3 hover:bg-rose-700 rounded-sm">
                  Quay lại đăng nhập
                </button>
              </div>
            )}
          </>
        )}

        {mode === 'device_otp' && (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-rose-50 text-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldQuestion className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-serif text-stone-900 mb-2">Xác thực thiết bị</h1>
              <p className="text-stone-500 text-xs mb-4">Mã OTP đã được gửi đến <span className="font-bold text-stone-800">{maskEmail(verificationEmail)}</span></p>
            </div>

            <form onSubmit={handleVerifyDeviceOtp} className="space-y-6">
              <input required type="text" maxLength={6} value={deviceOtp} onChange={e => setDeviceOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-stone-300 border px-4 py-3 text-center text-3xl font-black tracking-[0.4em] focus:ring-rose-500 focus:border-rose-500 bg-stone-50 rounded-sm outline-none" />

              <button disabled={isLoading} type="submit"
                className="w-full bg-rose-800 text-white font-bold uppercase tracking-wider text-sm py-3.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-900/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 rounded-sm">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xác thực...
                  </div>
                ) : 'Xác nhận thiết bị'}
              </button>

              <button type="button" onClick={() => setMode('login')} className="w-full text-stone-500 text-xs font-semibold hover:underline">
                ← Quay lại đăng nhập
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
