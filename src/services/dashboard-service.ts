import apiClient from '@/lib/api-client';
import { Order, OrderItem, ShippingInfo, UserInfo } from '@/types/order';
import { currencyService } from './currency-service';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: string;
  ordersGrowth: string;
  productsGrowth: string;
  customersGrowth: string;
  currency: 'GHS' | 'USD';
}

interface FormattedOrder extends Omit<Order, 'items'> {
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shipping: ShippingInfo;
  user: UserInfo;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardService {
  getStats(): Promise<DashboardStats>;
  getRecentOrders(limit?: number): Promise<FormattedOrder[]>;
}

// Helper to safely convert values to numbers
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper to safely format growth percentage
const safeGrowth = (value: any): string => {
  if (!value) return '+0%';
  if (typeof value === 'string' && value.includes('%')) return value;
  if (typeof value === 'number') return `${value >= 0 ? '+' : ''}${value}%`;
  return '+0%';
};

// Helper to convert USD to GHS
const convertToGHS = async (usdAmount: number): Promise<number> => {
  try {
    const rates = await currencyService.getExchangeRates();
    return usdAmount * rates.GHS;
  } catch (error) {
    console.error('Error converting currency:', error);
    // Fallback to default GHS rate if conversion fails
    return usdAmount * 12.05;
  }
};

const validateStats = async (data: any): Promise<DashboardStats> => {
  if (!data) {
    console.error('Empty stats data received');
    throw new Error('No statistics data received from server');
  }

  // Handle different response formats
  const stats = data.stats || data.data || data;
  console.log('Processing stats data:', stats);

  // Convert revenue to GHS if it's in USD
  let revenue = safeNumber(stats.totalRevenue || stats.revenue);
  if (stats.currency === 'USD') {
    revenue = await convertToGHS(revenue);
  }

  // Create stats object with safe conversions
  const validatedStats: DashboardStats = {
    totalRevenue: revenue,
    totalOrders: safeNumber(stats.totalOrders || stats.orders),
    totalProducts: safeNumber(stats.totalProducts || stats.products),
    totalCustomers: safeNumber(stats.totalCustomers || stats.customers),
    revenueGrowth: safeGrowth(stats.revenueGrowth),
    ordersGrowth: safeGrowth(stats.ordersGrowth),
    productsGrowth: safeGrowth(stats.productsGrowth),
    customersGrowth: safeGrowth(stats.customersGrowth),
    currency: 'GHS'
  };

  console.log('Validated stats:', validatedStats);
  return validatedStats;
};

const formatOrder = async (order: any): Promise<FormattedOrder> => {
  if (!order) throw new Error('Invalid order data');

  // Convert prices from USD to GHS if needed
  let total = safeNumber(order.total);
  if (order.currency === 'USD') {
    total = await convertToGHS(total);
  }

  const items = Array.isArray(order.items) ? await Promise.all(order.items.map(async (item: any) => {
    let price = safeNumber(item.price);
    if (order.currency === 'USD') {
      price = await convertToGHS(price);
    }
    return {
      productId: item.productId || '',
      name: item.name || 'Unknown Product',
      price,
      quantity: safeNumber(item.quantity),
      image: item.image || '',
    };
  })) : [];

  const formatted: FormattedOrder = {
    id: order.id || String(Math.random()),
    userId: order.userId || order.user?.id || '',
    items,
    status: order.status || 'pending',
    total,
    shippingAddress: order.shippingAddress || order.shipping?.address || {},
    shipping: order.shipping || {
      name: order.customer?.name || 'Unknown',
      email: order.customer?.email || 'No email',
      phone: order.customer?.phone || '',
      address: order.shippingAddress || {}
    },
    user: order.user || {
      id: order.userId || '',
      email: order.customer?.email || '',
      name: order.customer?.name || 'Unknown'
    },
    customer: {
      name: order.customer?.name || order.shipping?.name || order.user?.name || 'Unknown',
      email: order.customer?.email || order.shipping?.email || order.user?.email || 'No email',
      phone: order.customer?.phone || order.shipping?.phone
    },
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString()
  };

  return formatted;
};

export const dashboardService: DashboardService = {
  async getStats() {
    try {
      console.log('Fetching dashboard stats...');
      const response = await apiClient.get('/api/admin/dashboard/stats');
      
      console.log('Dashboard stats raw response:', response);
      
      if (!response.data) {
        console.error('Empty response from dashboard stats API');
        throw new Error('Empty response from server');
      }

      const stats = await validateStats(response.data);
      return stats;
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      
      // Network error
      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }
      
      // Auth errors
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to access dashboard statistics');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to access dashboard statistics');
      }
      
      // Invalid data error
      if (error.message.includes('No statistics')) {
        throw new Error('Unable to load statistics. Please try again later.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to load dashboard statistics');
    }
  },

  async getRecentOrders(limit: number = 10) {
    try {
      console.log('Fetching recent orders...');
      const response = await apiClient.get('/api/admin/dashboard/recent-orders', {
        params: { limit }
      });

      console.log('Recent orders response:', response.data);
      if (!response.data) {
        console.error('Invalid recent orders response format');
        throw new Error('Invalid response format from server');
      }

      // Handle both array and object with orders property
      const orders = Array.isArray(response.data) ? response.data : 
                    Array.isArray(response.data.orders) ? response.data.orders : [];

      return Promise.all(orders.map(formatOrder));
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
      // Check if it's a network error
      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to access recent orders');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to access recent orders');
      }
      throw new Error(error.response?.data?.message || 'Failed to load recent orders');
    }
  }
};
