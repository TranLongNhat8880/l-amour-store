import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Checkout } from "./pages/Checkout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { Wishlist } from "./pages/Wishlist";
import { Cart } from "./pages/Cart";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminProducts } from "./pages/admin/Products";
import { AdminOrders } from "./pages/admin/Orders";
import { AdminCategories } from "./pages/admin/Categories";
import { AdminVouchers } from "./pages/admin/Vouchers";
import { AdminUsers } from "./pages/admin/Users";
import { AdminReviews } from "./pages/admin/Reviews";
import { AdminNotifications } from "./pages/admin/Notifications";
import { AdminSettings } from "./pages/admin/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "shop", Component: Shop },
      { path: "product/:id", Component: ProductDetail },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "wishlist", Component: Wishlist },
      { path: "cart", Component: Cart },
      
      // Protected Routes
      {
        Component: ProtectedRoute,
        children: [
          { path: "checkout", Component: Checkout },
          { path: "profile", Component: Profile },
        ]
      },
    ],
  },
  // Admin Routes
  {
    path: "/admin",
    Component: AdminRoute,
    children: [
      {
        Component: AdminLayout,
        children: [
          { path: "dashboard", Component: AdminDashboard },
          { path: "products", Component: AdminProducts },
          { path: "categories", Component: AdminCategories },
          { path: "orders", Component: AdminOrders },
          { path: "vouchers", Component: AdminVouchers },
          { path: "users", Component: AdminUsers },
          { path: "reviews", Component: AdminReviews },
          { path: "notifications", Component: AdminNotifications },
          { path: "settings", Component: AdminSettings },
        ]
      }
    ]
  }
]);
