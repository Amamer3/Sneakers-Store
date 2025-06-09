import apiClient from '@/lib/api-client';
import { Order, PaginatedResponse, CreateOrderInput, UpdateOrderStatusInput, OrderStatus } from '@/types/order';

const convertOrder = (order: any): Order => ({
  ...order,
  createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
  updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
  total: typeof order.total === 'string' ? parseFloat(order.total) : order.total || 0,
  items: (order.items || []).map((item: any) => ({
    ...item,
    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
    quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity || 0
  }))
});

const convertPaginatedResponse = (
  data: any,
  page: number,
  limit: number
): PaginatedResponse<Order> => {
  const items = (data.items || []).map(convertOrder);
  const totalItems = data.totalItems || data.total || 0;
  const totalPages = data.totalPages || Math.ceil(totalItems / limit);
  const currentPage = data.currentPage || data.page || page;
  return {
    items,
    totalItems,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    hasMore: currentPage < totalPages
  };
};

interface OrderQueryParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface OrderServiceInterface {  // User endpoints
  createOrder(orderData: CreateOrderInput): Promise<Order>;
  getMyOrders(): Promise<PaginatedResponse<Order>>;
  getOrderById(orderId: string): Promise<Order>;

  // Debug method to print order data
  logOrderData(orderData: CreateOrderInput): void;
  
  // Admin endpoints
  getOrders(params?: OrderQueryParams): Promise<PaginatedResponse<Order>>;
  updateOrderStatus(orderId: string, statusData: UpdateOrderStatusInput): Promise<Order>;
}

export const orderService: OrderServiceInterface = {
  // POST /api/orders - Create a new order (requires user authentication)
  async createOrder(orderData: CreateOrderInput): Promise<Order> {
    try {      // Log the complete order data for debugging
      this.logOrderData(orderData);

      // Make the API call
      const response = await apiClient.post('/api/orders', orderData);
      
      // Convert and validate the response
      if (!response.data) {
        throw new Error('No data received from order creation');
      }

      if (!response.data.id) {
        throw new Error('Order created but no ID received');
      }

      return convertOrder(response.data);
    } catch (error: any) {
      // Log detailed error information
      console.error('[OrderService] Error creating order:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        orderData: {
          itemCount: orderData.items.length,
          total: orderData.total,
          hasShipping: !!orderData.shippingAddress,
          status: orderData.status
        }
      });

      if (error.response?.data?.message) {
        throw new Error(`Failed to create order: ${error.response.data.message}`);
      }

      throw new Error('Failed to create order: ' + error.message);
    }
  },

  // GET /api/orders/my - Get authenticated user's orders
  async getMyOrders(): Promise<PaginatedResponse<Order>> {
    try {
      const response = await apiClient.get<any>('/api/orders/my');
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      return convertPaginatedResponse(response.data, 1, 10);
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user orders');
    }
  },

  // GET /api/orders/:id - Get specific order by ID
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<any>(`/api/orders/${orderId}`);
      if (!response.data) {
        throw new Error('Order not found');
      }
      return convertOrder(response.data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  },

  // GET /api/orders - Get all orders (admin only)
  async getOrders(
    pageOrParams?: number | OrderQueryParams,
    limit?: number,
    status?: OrderStatus,
    sort?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<Order>> {
    try {
      let params: OrderQueryParams;
      
      if (typeof pageOrParams === 'object') {
        params = pageOrParams;
      } else {
        params = {
          page: pageOrParams || 1,
          limit: limit || 10,
          status: status,
          ...(sort || {})
        };
      }

      const response = await apiClient.get<any>('/api/orders', { params });
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      return convertPaginatedResponse(
        response.data,
        params.page || 1,
        params.limit || 10
      );
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  },

  // PUT/PATCH /api/orders/:id/status - Update order status (admin only)
  async updateOrderStatus(orderId: string, statusData: UpdateOrderStatusInput): Promise<Order> {
    try {
      const response = await apiClient.patch<any>(`/api/orders/${orderId}/status`, statusData);
      return convertOrder(response.data);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update order status');
    }
  },

  // Debug method to log order data
  logOrderData(orderData: CreateOrderInput): void {
    console.log('[OrderService] Order Data Debug:', {
      items: orderData.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      shippingAddress: orderData.shippingAddress,
      total: orderData.total,
      status: orderData.status,
      deliveryFee: orderData.deliveryFee,
      tax: orderData.tax
    });
  },
};
