import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { DeliveryProvider } from "@/context/DeliveryContext";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/components/AdminLayout";
import MainLayout from "@/components/MainLayout";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import OrderDetails from "./pages/OrderDetails";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Analytics from "./pages/admin/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRouteWrapper = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
);

const AdminRouteWrapper = () => (
  <AdminRoute>
    <Outlet />
  </AdminRoute>
);

const AdminLayoutWrapper = () => (
  <AdminLayout />
);

const MainLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <MainLayout>
    {children}
  </MainLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CurrencyProvider>
              <BrowserRouter>
                <Toaster />
                <Sonner />
                <DeliveryProvider>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<MainLayoutWrapper><Index /></MainLayoutWrapper>} />
                    <Route path="/product/:id" element={<MainLayoutWrapper><ProductDetail /></MainLayoutWrapper>} />
                    <Route path="/cart" element={<MainLayoutWrapper><Cart /></MainLayoutWrapper>} />
                    <Route path="/wishlist" element={<MainLayoutWrapper><Wishlist /></MainLayoutWrapper>} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRouteWrapper />}>
                      <Route path="/checkout" element={<MainLayoutWrapper><Checkout /></MainLayoutWrapper>} />
                      <Route path="/profile" element={<MainLayoutWrapper><Profile /></MainLayoutWrapper>} />
                      <Route path="/order/:orderId" element={<MainLayoutWrapper><OrderDetails /></MainLayoutWrapper>} />
                      <Route path="/order/:orderId/success" element={<MainLayoutWrapper><OrderSuccess /></MainLayoutWrapper>} />
                    </Route>                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route element={<AdminRouteWrapper />}>
                      <Route element={<AdminLayoutWrapper />}>
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/admin/products" element={<Products />} />
                        <Route path="/admin/orders" element={<Orders />} />
                        <Route path="/admin/users" element={<Users />} />
                        <Route path="/admin/analytics" element={<Analytics />} />
                      </Route>
                    </Route>

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DeliveryProvider>
              </BrowserRouter>
            </CurrencyProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
