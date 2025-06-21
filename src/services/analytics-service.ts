import apiClient from '@/lib/api-client';

interface OverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

interface RevenueStats {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const getOverviewStats = async (): Promise<OverviewStats> => {
  const response = await apiClient.get('/analytics/overview');
  return response.data;
};

const getRevenueStats = async (
  interval: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): Promise<RevenueStats> => {
  const response = await apiClient.get('/analytics/revenue', {
    params: { interval, startDate, endDate }
  });
  return response.data;
};

const getProductsByCategory = async (): Promise<Record<string, number>> => {
  const response = await apiClient.get('/analytics/products/by-category');
  return response.data;
};

const getOrderAnalytics = async (
  interval: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): Promise<any> => {
  const response = await apiClient.get('/analytics/orders', {
    params: { interval, startDate, endDate }
  });
  return response.data;
};

const getProductAnalytics = async (): Promise<any> => {
  const response = await apiClient.get('/analytics/products');
  return response.data;
};

const getTopSellingProducts = async (limit = 10): Promise<any> => {
  const response = await apiClient.get('/analytics/products/top-selling', {
    params: { limit }
  });
  return response.data;
};

const getLowStockProducts = async (threshold = 10): Promise<any> => {
  const response = await apiClient.get('/analytics/products/low-stock', {
    params: { threshold }
  });
  return response.data;
};

const getCustomerAnalytics = async (): Promise<any> => {
  const response = await apiClient.get('/analytics/customers');
  return response.data;
};

export {
  getOverviewStats,
  getRevenueStats,
  getProductsByCategory,
  getOrderAnalytics,
  getProductAnalytics,
  getTopSellingProducts,
  getLowStockProducts,
  getCustomerAnalytics,
  type OverviewStats,
  type RevenueStats
};
