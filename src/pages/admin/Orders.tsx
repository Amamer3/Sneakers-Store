import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Loader2, RefreshCw, ChevronUp } from 'lucide-react';
import { Order, ShippingInfo, UserInfo } from '@/types/order';
import { orderService } from '@/services/order-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCurrency } from '@/context/CurrencyContext';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-600">Something went wrong displaying this order.</p>
          {this.state.error && (
            <p className="text-sm text-red-500 mt-2">{this.state.error.message}</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

interface OrdersState {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  pageLoading: boolean; // For pagination loading state
  error: string | null;
  sortBy: 'createdAt' | 'total' | 'status';
  sortOrder: 'asc' | 'desc';
}

const initialState: OrdersState = {
  orders: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasMore: false,
  loading: true,
  pageLoading: false,
  error: null,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const OrderStatusBadgeVariant: Record<Order['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'pending': 'secondary',
  'processing': 'secondary',
  'shipped': 'default',
  'delivered': 'default',
  'cancelled': 'destructive',
  'failed': 'destructive'
} as const;

const Orders = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  
  const [state, setState] = useState<OrdersState>(initialState);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | 'all'>('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const formatOrderDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadOrders = async (page: number = state.page, isPageChange: boolean = false) => {
    if (!isAuthenticated || !isAdmin) {
      setState(prev => ({ ...prev, error: 'You must be logged in as an admin to view this page', loading: false }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        loading: !isPageChange && prev.loading, 
        pageLoading: isPageChange,
        error: null 
      }));
        const response = await orderService.getOrders({
        page,
        limit: state.limit,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      });
        setState(prev => ({
        ...prev,
        orders: response.items,
        total: response.totalItems,
        page: response.currentPage,
        limit: state.limit,
        totalPages: response.totalPages,
        hasMore: response.hasNextPage,
        loading: false,
        pageLoading: false
      }));
    } catch (error: any) {
      console.error('Error loading orders:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load orders';
      setState(prev => ({
        ...prev,
        loading: false,
        pageLoading: false,
        error: errorMessage
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!selectedOrder) return;

    // Store the previous status for rollback
    const previousStatus = selectedOrder.status;
    
    // Optimistically update the UI
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    }));

    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      
      toast({
        title: 'Status Updated',
        description: `Order status has been updated to ${newStatus}`,
      });
      
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      
      // Rollback the optimistic update
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId 
            ? { ...order, status: previousStatus }
            : order
        )
      }));

      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update order status';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSort = (sortBy: OrdersState['sortBy']) => {
    setState(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy ? (prev.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'
    }));
    loadOrders(1);
  };

  // Effect for loading orders
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      // Reset to page 1 when status or sorting changes
      setState(prev => ({ ...prev, page: 1 }));
      loadOrders(1);
    }
  }, [isAuthenticated, isAdmin, selectedStatus, state.sortBy, state.sortOrder]);

  // Show auth error if not admin
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  const renderOrder = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5" />
              <span className="font-semibold">Order #{order.id}</span>
              <Badge variant={OrderStatusBadgeVariant[order.status]}>
                {order.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Items: {order.items.length} | Total: {formatPrice(order.total)}
              </p>              <p className="text-sm text-gray-500">
                Created: {order.createdAt instanceof Date 
                  ? order.createdAt.toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : new Date(order.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                }
              </p>
                {/* Customer Information */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Customer Details:</h4>                <div className="text-sm text-gray-600">
                  <p>Name: {order.shipping?.name || order.user?.name || 'N/A'}</p>
                  <p>Email: {order.shipping?.email || order.user?.email || 'N/A'}</p>
                  <p>Phone: {order.shipping?.phone || order.shippingAddress?.phone || 'N/A'}</p>
                  <p className="text-xs text-gray-400">Customer ID: {order.userId || 'N/A'}</p>
                </div>
              </div>{/* Shipping Information */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Shipping Address:</h4>
                <div className="text-sm text-gray-600">
                  {(order.shippingAddress || order.shipping?.address) ? (
                    <>
                      <p>{order.shippingAddress?.street || order.shipping?.address?.street}</p>
                      <p>
                        {order.shippingAddress?.city || order.shipping?.address?.city}, {' '}
                        {order.shippingAddress?.state || order.shipping?.address?.state} {' '}
                        {order.shippingAddress?.postalCode || order.shipping?.address?.postalCode}
                      </p>
                      <p>{order.shippingAddress?.country || order.shipping?.address?.country}</p>
                    </>
                  ) : (
                    <p>No shipping address provided</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Items:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.quantity}x {formatPrice(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="ml-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOrder(order);
                setIsStatusDialogOpen(true);
              }}
              disabled={updatingStatus && selectedOrder?.id === order.id}
            >
              {updatingStatus && selectedOrder?.id === order.id ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <Button
            variant="outline"
            onClick={() => loadOrders(1)}
            disabled={state.loading}
          >
            {state.loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Refreshing...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Refresh</span>
              </div>
            )}
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="w-[200px]">
            <Select
              value={selectedStatus}
              onValueChange={(value: Order['status'] | 'all') => setSelectedStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSort('createdAt')}
              className={state.sortBy === 'createdAt' ? 'bg-primary/10' : ''}
            >
              Date {state.sortBy === 'createdAt' && (
                <ChevronUp className={`ml-1 h-4 w-4 ${state.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSort('total')}
              className={state.sortBy === 'total' ? 'bg-primary/10' : ''}
            >
              Total {state.sortBy === 'total' && (
                <ChevronUp className={`ml-1 h-4 w-4 ${state.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSort('status')}
              className={state.sortBy === 'status' ? 'bg-primary/10' : ''}
            >
              Status {state.sortBy === 'status' && (
                <ChevronUp className={`ml-1 h-4 w-4 ${state.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {state.loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {state.error && (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-600">{state.error}</p>
        </div>
      )}      {!state.loading && !state.error && (
        <>
          <div className="grid gap-4">
            {state.orders.map((order) => (
              <ErrorBoundary key={order.id}>
                {renderOrder(order)}
              </ErrorBoundary>
            ))}
          </div>

          {state.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => loadOrders(state.page - 1, true)}
                disabled={state.page === 1 || state.pageLoading}
              >
                {state.pageLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Previous'
                )}
              </Button>
              <span className="py-2 px-4">
                Page {state.page} of {state.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => loadOrders(state.page + 1, true)}
                disabled={!state.hasMore || state.pageLoading}
              >
                {state.pageLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              defaultValue={selectedOrder?.status}
              onValueChange={(value: Order['status']) => {
                if (selectedOrder) {
                  handleUpdateStatus(selectedOrder.id, value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
