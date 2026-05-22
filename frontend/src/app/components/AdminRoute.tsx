import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";

export function AdminRoute() {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    // Chưa đăng nhập -> về login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    // Đã đăng nhập nhưng không phải admin -> về home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
