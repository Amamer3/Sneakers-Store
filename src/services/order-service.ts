import apiClient from '@/lib/api-client';
import { Order, PaginatedResponse, CreateOrderInput, UpdateOrderStatusInput } from '@/types/order';

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

interface OrderSort {
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface OrderServiceInterface {
  getOrders(page?: number, limit?: number, status?: Order['status'], sort?: OrderSort): Promise<PaginatedResponse<Order>>;
  getUserOrders(page?: number, limit?: number, status?: Order['status']): Promise<PaginatedResponse<Order>>;
  getOrderById(orderId: string): Promise<Order>;
  createOrder(orderData: CreateOrderInput): Promise<Order>;
  updateOrderStatus(orderId: string, statusData: UpdateOrderStatusInput): Promise<Order>;
}

export const orderService: OrderServiceInterface = {
  async getOrders(page = 1, limit = 10, status?: Order['status'], sort?: OrderSort) {
    try {
      const response = await apiClient.get<PaginatedResponse<Order>>('/api/orders', {
        params: { 
          page, 
          limit, 
          status,
          sortBy: sort?.sortBy,
          sortOrder: sort?.sortOrder
        }
      });
      
      if (!response.data?.items) {
        throw new Error('Invalid response format from server');
      }

      return {
        ...response.data,
        items: response.data.items.map(convertOrder)
      };
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 404) {
        throw new Error('Orders endpoint not found. Please check API configuration.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view orders.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch orders. Please try again.');
    }
  },

  async getUserOrders(page = 1, limit = 10, status?: Order['status']) {
    try {
      const response = await apiClient.get<PaginatedResponse<Order>>('/api/orders/my', {
        params: { page, limit, status }
      });
      
      if (!response.data?.items) {
        throw new Error('Invalid response format from server');
      }

      return {
        ...response.data,
        items: response.data.items.map(convertOrder)
      };
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      if (error.response?.status === 404) {
        throw new Error('User orders endpoint not found. Please check API configuration.');
      }
      throw error;
    }
  },

  async getOrderById(orderId: string) {
    try {
      const response = await apiClient.get<Order>(`/api/orders/${orderId}`);
      return convertOrder(response.data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      }
      throw error;
    }
  },
  async createOrder(orderData: CreateOrderInput) {
    try {
      if (!orderData.items?.length) {
        throw new Error('Order must contain items');
      }

      // Validate total amount
      const calculatedTotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (!calculatedTotal || calculatedTotal <= 0) {
        throw new Error('Valid total amount is required');
      }

      // Clean up the order data
      const cleanOrderData = {
        items: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name || '',
          price: parseFloat(item.price.toString()),
          image: item.image || ''
        })),
        shippingAddress: {
          street: orderData.shippingAddress.street.trim(),
          city: orderData.shippingAddress.city.trim(),
          state: orderData.shippingAddress.state.trim(),
          country: orderData.shippingAddress.country.trim(),
          postalCode: orderData.shippingAddress.postalCode,
          zipCode: orderData.shippingAddress.zipCode
        },
        total: calculatedTotal
      };

      const response = await apiClient.post<Order>('/orders', cleanOrderData);
      return convertOrder(response.data);
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, statusData: UpdateOrderStatusInput) {
    try {
      const response = await apiClient.patch<Order>(`/api/orders/${orderId}/status`, statusData);
      return convertOrder(response.data);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to update order status');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to update order status');
      }
      throw new Error(error.response?.data?.message || 'Failed to update order status. Please try again later.');
    }
  }
};
