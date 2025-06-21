import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Order } from '@/types/order';
import { orderService } from '@/services/order-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderHistoryState {
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
  'pending': 'secondary',
  'confirmed': 'default',
  'processing': 'secondary',
  'shipped': 'default',
  'delivered': 'default',
  'cancelled': 'destructive',
  'refunded': 'outline',
  'failed': 'destructive'
} as const;

const OrderHistory = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<OrderHistoryState>({
    orders: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
    loading: true,
    error: null
  });

  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | 'all'>('all');

  const loadOrders = async (page: number = state.page) => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, error: 'You must be logged in to view your orders', loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await orderService.getMyOrders(
        page,
        state.limit,
        selectedStatus === 'all' ? undefined : selectedStatus
      );
      
      setState(prev => ({
        ...prev,
        orders: response.items,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasMore: response.hasMore,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.message || 'Failed to load orders'
      }));
      toast({
        title: 'Error',
        description: 'Failed to load your orders',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadOrders(1); // Reset to first page when status changes
  }, [isAuthenticated, selectedStatus]);

  const handlePageChange = (newPage: number) => {
    loadOrders(newPage);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-gray-600">You must be logged in to view your order history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order History</h1>
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
      </div>

      {state.loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {state.error && (
        <div className="text-center text-red-600 p-4">
          {state.error}
        </div>
      )}

      {!state.loading && !state.error && state.orders.length === 0 && (
        <div className="text-center text-gray-600 p-4">
          {selectedStatus === 'all' 
            ? "You haven't placed any orders yet."
            : `No ${selectedStatus} orders found.`}
        </div>
      )}

      {!state.loading && !state.error && state.orders.length > 0 && (
        <>
          <div className="grid gap-4">
            {state.orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5" />
                        <span className="font-semibold">Order #{order.id}</span>
                        <Badge variant={OrderStatusBadgeVariant[order.status]}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">
                          Items: {order.items.length} | Total: ${order.total}
                        </p>
                        <p className="text-sm text-gray-500">
                          Ordered on: {order.createdAt.toLocaleString()}
                        </p>
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-1">Items:</h4>
                          <ul className="text-sm text-gray-600">
                            {order.items.map((item, index) => (
                              <li key={index} className="flex justify-between">
                                <span>{item.name}</span>
                                <span>{item.quantity}x ${item.price}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {state.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(state.page - 1)}
                disabled={state.page === 1}
              >
                Previous
              </Button>
              <span className="py-2 px-4">
                Page {state.page} of {state.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(state.page + 1)}
                disabled={!state.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;
