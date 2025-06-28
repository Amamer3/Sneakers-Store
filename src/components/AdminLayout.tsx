import React, { useState, useEffect } from 'react';
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
  Bell,
  Moon,
  Sun,
  User,
  Settings
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import FallbackBanner from '@/components/FallbackBanner';

// Define interfaces
interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AuthContext {
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  user: {
    name: string; username?: string; email?: string 
} | null;
}

interface Notification {
  id: string;
  unread: boolean;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
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

const AdminLayout: React.FC = () => {
  const { logout, isAdmin, isAuthenticated, user } = useAuth() as AuthContext;
  const location = useLocation();
  const navigate = useNavigate();
  const [showFallbackBanner, setShowFallbackBanner] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  // Check backend status and fetch notifications
  useEffect(() => {
    const checkBackendStatus = async () => {
      setIsLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Get auth token for authenticated requests
        const token = localStorage.getItem('token');
        
        // Skip notifications fetch if no token available
        if (!token) {
          console.warn('No authentication token found - skipping notifications fetch');
          setUnreadNotifications(0);
          return;
        }
        
        const [healthResponse, notificationsResponse] = await Promise.all([
          fetch('https://sneaker-server-7gec.onrender.com/api/health', {
            method: 'GET',
            signal: controller.signal
          }),
          // Use apiClient for authenticated requests
          apiClient.get('/notifications', {
            signal: controller.signal
          }).then(response => ({
            ok: true,
            status: 200,
            json: () => Promise.resolve(response.data)
          })).catch(error => ({
            ok: false,
            status: error.response?.status || 500,
            json: () => Promise.resolve([])
          }))
        ]);
        
        clearTimeout(timeoutId);
        
        setShowFallbackBanner(!healthResponse.ok);
        
        if (notificationsResponse.ok) {
          const notifications: Notification[] = await notificationsResponse.json();
          const unreadCount = notifications.filter(n => n.unread).length;
          setUnreadNotifications(unreadCount);
        } else if (notificationsResponse.status === 401) {
          console.warn('Unauthorized access to notifications - user may need to re-login');
          setUnreadNotifications(0);
        } else {
          console.warn('Failed to fetch notifications:', notificationsResponse.status);
          setUnreadNotifications(0);
        }
      } catch (error) {
        console.warn('Backend health check or notifications fetch failed:', error);
        setShowFallbackBanner(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogout = (): void => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = (): void => {
    logout();
    navigate('/');
    setShowLogoutDialog(false);
  };

  const navItems: NavItem[] = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/order-management', icon: ClipboardList, label: 'Order Management' },
    { path: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
    { path: '/admin/coupons', icon: Gift, label: 'Coupons' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  const NavLinks: React.FC = React.memo(() => (
    <nav className="space-y-1" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white ${
            location.pathname === item.path ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' : ''
          }`}
          aria-current={location.pathname === item.path ? 'page' : undefined}
        >
          <item.icon className="h-5 w-5" aria-hidden="true" />
          <span>{item.label}</span>
          {item.badge ? (
            <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  ));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 z-30">
          <div className="flex h-16 items-center border-b px-6 bg-white dark:bg-gray-800 shadow-sm">
            <span className="font-semibold text-lg text-gray-900 dark:text-white">Admin Dashboard</span>
          </div>
          <div className="flex-1 overflow-auto border-r bg-white dark:bg-gray-800 p-4">
            <div className="mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back {user?.name || user?.email || 'Admin'}
              </span>
            </div>
            <NavLinks />
            <div className="mt-auto pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Header with Sidebar Trigger */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b shadow-sm">
          <div className="flex h-16 items-center px-4 justify-between">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4 bg-white dark:bg-gray-800">
                <div className="mb-4">
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">Admin Dashboard</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Logged in as {user?.username || user?.email || 'Admin'}
                  </p>
                </div>
                <NavLinks />
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">Admin Dashboard</span>
            <div className="flex items-center gap-2">
              {isLoading && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-gray-600 dark:text-gray-300">
                    {user?.username || user?.email || 'Admin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="flex items-center"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="h-4 w-4 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 mr-2" />
                        Dark Mode
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <div className="hidden lg:flex h-16 items-center justify-end gap-4 border-b bg-white dark:bg-gray-800 px-6 shadow-sm sticky top-0 z-20">
            {isLoading && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2" aria-label="User menu">
                  <User className="h-5 w-5" />
                  <span>{user?.username || user?.email || 'Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/admin/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex items-center"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ErrorBoundary>
            <div className="container py-6 px-4 sm:px-6 lg:px-8">
              <FallbackBanner 
                isVisible={showFallbackBanner}
                message="Admin panel is running in demo mode while the backend server is being deployed. You can explore the interface with sample data."
                type="demo"
              />
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the home page and will need to login again to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLayout;