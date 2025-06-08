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

export {
  getOverviewStats,
  getRevenueStats,
  getProductsByCategory,
  type OverviewStats,
  type RevenueStats
};
