import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, PaginatedResponse, CreateOrderInput, OrderStatus } from '@/types/order';
import { orderService } from '@/services/order-service';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OrderContextType {
  // State
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  
  // Actions
  createOrder: (orderData: CreateOrderInput) => Promise<Order>;
  getMyOrders: (page?: number) => Promise<void>;
  getOrderById: (orderId: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  refreshOrders: () => Promise<void>;
  clearError: () => void;
  
  // Real-time updates
  subscribeToOrderUpdates: (orderId: string) => () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Create new order with optimistic updates
  const createOrder = async (orderData: CreateOrderInput): Promise<Order> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newOrder = await orderService.createOrder(orderData);
      
      // Optimistic update - add to beginning of orders list
      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder(newOrder);
      
      toast({
        title: 'Order Created',
        description: `Order #${newOrder.id} has been created successfully`,
      });
      
      return newOrder;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create order';
      setError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's orders with pagination
  const getMyOrders = async (page: number = 1): Promise<void> => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response: PaginatedResponse<Order> = await orderService.getMyOrders();
      
      if (page === 1) {
        setOrders(response.items);
      } else {
        setOrders(prev => [...prev, ...response.items]);
      }
      
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setHasMore(response.hasMore);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load orders';
      setError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get specific order by ID
  const getOrderById = async (orderId: string): Promise<Order> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const order = await orderService.getOrderById(orderId);
      setCurrentOrder(order);
      
      // Update in orders list if it exists
      setOrders(prev => 
        prev.map(o => o.id === orderId ? order : o)
      );
      
      return order;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load order';
      setError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status (admin only)
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, { status });
      
      // Update in orders list
      setOrders(prev => 
        prev.map(o => o.id === orderId ? updatedOrder : o)
      );
      
      // Update current order if it's the same
      if (currentOrder?.id === orderId) {
        setCurrentOrder(updatedOrder);
      }
      
      toast({
        title: 'Status Updated',
        description: `Order status updated to ${status}`,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update order status';
      setError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh orders
  const refreshOrders = async (): Promise<void> => {
    await getMyOrders(1);
  };

  // Clear error state
  const clearError = (): void => {
    setError(null);
  };

  // Subscribe to real-time order updates (placeholder for WebSocket implementation)
  const subscribeToOrderUpdates = (orderId: string): (() => void) => {
    // This would typically connect to a WebSocket or Server-Sent Events
    // For now, we'll implement polling as a fallback
    const interval = setInterval(async () => {
      try {
        await getOrderById(orderId);
      } catch (err) {
        console.error('Failed to poll order updates:', err);
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  };

  // Load initial orders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getMyOrders(1);
    } else {
      // Clear orders when not authenticated
      setOrders([]);
      setCurrentOrder(null);
      setError(null);
    }
  }, [isAuthenticated]);

  const value: OrderContextType = {
    // State
    orders,
    currentOrder,
    isLoading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    hasMore,
    
    // Actions
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    refreshOrders,
    clearError,
    
    // Real-time updates
    subscribeToOrderUpdates,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;