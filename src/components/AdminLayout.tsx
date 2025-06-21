import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut,
  Menu,
  BarChart3,
  AlertTriangle,
  ClipboardList,
  Warehouse,
  Gift,
  Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An error occurred while loading this section. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminLayout = () => {
  const { logout, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/order-management', icon: ClipboardList, label: 'Order Management' },
    { path: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
    { path: '/admin/coupons', icon: Gift, label: 'Coupons' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  const NavLinks = () => (
    <div className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            location.pathname === item.path ? 'bg-gray-100 text-gray-900' : ''
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex h-screen w-64 flex-col fixed left-0">
          <div className="flex h-14 items-center border-b px-4 bg-white">
            <span className="font-semibold">Admin Dashboard</span>
          </div>
          <div className="flex-1 overflow-auto border-r bg-white p-4">
            <NavLinks />
          </div>
        </aside>

        {/* Mobile Header with Sidebar Trigger */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b">
          <div className="flex h-14 items-center px-4 justify-between">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <div className="mb-4">
                  <span className="font-semibold">Admin Dashboard</span>
                </div>
                <NavLinks />
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Admin Dashboard</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
          <div className="hidden lg:flex h-14 items-center justify-end gap-4 border-b bg-white px-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          <ErrorBoundary>
            <div className="container py-4">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
