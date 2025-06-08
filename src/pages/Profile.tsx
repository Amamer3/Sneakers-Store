import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types/order';
import { orderService } from '@/services/order-service';
import { profileService } from '@/services/profile-service';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Package, User, Heart, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Utility functions for formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (date: Date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface OrdersState {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

const OrderStatusBadgeVariant: Record<Order['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
  failed: 'default'
};

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const [ordersState, setOrdersState] = useState<OrdersState>({
    orders: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic',
      delay: 100,
    });
  }, []);

  useEffect(() => {
    if (user?.name && !editedName) {
      setEditedName(user.name);
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setOrdersState(prev => ({ ...prev, loading: true, error: null }));
      const response = await orderService.getUserOrders(ordersState.page);
      setOrdersState(prev => ({
        ...prev,
        orders: ordersState.page === 1 ? response.items : [...prev.orders, ...response.items],
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasMore: response.hasMore,
        loading: false,
      }));
    } catch (error: any) {
      setOrdersState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load your orders.',
      }));
      toast({
        title: 'Error',
        description: 'Failed to load your orders. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const loadMoreOrders = () => {
    setOrdersState(prev => ({ ...prev, page: prev.page + 1 }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, ordersState.page]);

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await profileService.updateProfile({ name: editedName });
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-10 w-1/3 mb-6 rounded-md" />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-aos="fade-up">
          <Card className="rounded-lg shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Please log in to view your profile
              </h2>
              <Link to="/login">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2"
                  aria-label="Go to login page"
                >
                  Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8" data-aos="fade-up">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-base text-gray-600 mt-2">Manage your account, orders, and wishlist</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-gray-100 rounded-md p-1 flex flex-wrap gap-2">
            <TabsTrigger
              value="profile"
              className="flex-1 sm:flex-none rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex-1 sm:flex-none rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="wishlist"
              className="flex-1 sm:flex-none rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" data-aos="fade-up" data-aos-delay="100">
            <Card className="rounded-lg shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Name</Label>
                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Edit name"
                        />
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isSaving || !editedName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2"
                            aria-label="Save name"
                          >
                            {isSaving ? (
                              <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              'Save'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setEditedName(user.name);
                            }}
                            className="rounded-md border-gray-300 hover:bg-blue-50"
                            aria-label="Cancel edit"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-base text-gray-900">{user.name}</p>
                        <Button
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="text-blue-600 hover:text-blue-700"
                          aria-label="Edit name"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-base text-gray-900 mt-2">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Type</Label>
                    <Badge
                      variant="outline"
                      className="mt-2 border-blue-200 text-blue-600 font-medium"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" data-aos="fade-up" data-aos-delay="100">
            <Card className="rounded-lg shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">My Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersState.loading && ordersState.orders.length === 0 && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card key={`order-skeleton-${index}`} className="rounded-lg shadow-sm">
                        <CardContent className="p-4">
                          <Skeleton className="h-24 w-full rounded-md" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {ordersState.error && (
                  <div className="flex flex-col items-center justify-center p-8">
                    <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
                    <p className="text-red-600 text-base">{ordersState.error}</p>
                    <Button
                      variant="outline"
                      className="mt-4 rounded-md border-gray-300 hover:bg-blue-50"
                      onClick={() => loadOrders()}
                      aria-label="Retry loading orders"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {!ordersState.loading && !ordersState.error && ordersState.orders.length === 0 && (
                  <div className="text-center py-10">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No orders yet</h3>
                    <p className="text-base text-gray-600 mt-2">
                      Start shopping to place your first order!
                    </p>
                    <Link to="/">
                      <Button
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2"
                        aria-label="Browse products"
                      >
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                )}

                {!ordersState.loading && !ordersState.error && ordersState.orders.length > 0 && (
                  <div className="space-y-6">
                    {ordersState.orders.map((order) => (
                      <Card key={order.id} className="rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Package className="w-5 h-5 text-gray-600" />
                                <span className="font-semibold text-base text-gray-900">
                                  Order #{order.id}
                                </span>
                                <Badge
                                  variant={OrderStatusBadgeVariant[order.status]}
                                  className="text-xs font-medium"
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                  Items: {order.items.length} | Total: {formatCurrency(order.total)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Ordered on: {formatDate(new Date(order.createdAt))}
                                </p>
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                                    Items:
                                  </h4>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {order.items.map((item) => (
                                      <li
                                        key={`${order.id}-item-${item.productId}`}
                                        className="flex justify-between"
                                      >
                                        <span className="truncate max-w-[60%]">{item.name}</span>
                                        <span>
                                          {item.quantity}x {formatCurrency(item.price)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                            <Link to={`/order/${order.id}`}>
                              <Button
                                variant="outline"
                                className="rounded-md border-gray-300 hover:bg-blue-50"
                                aria-label={`View order ${order.id} details`}
                              >
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {ordersState.hasMore && (
                      <div className="text-center mt-8">
                        <Button
                          onClick={loadMoreOrders}
                          disabled={ordersState.loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2"
                          aria-label="Load more orders"
                        >
                          {ordersState.loading ? (
                            <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            'Load More'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wishlist" data-aos="fade-up" data-aos-delay="100">
            <Card className="rounded-lg shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">My Wishlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">View your wishlist</h3>
                  <p className="text-base text-gray-600 mt-2">
                    Check out your saved items in the wishlist section.
                  </p>
                  <Link to="/wishlist">
                    <Button
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2"
                      aria-label="Go to wishlist"
                    >
                      Go to Wishlist
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;