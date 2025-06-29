// Overview Analytics Types
export interface OverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  todayRevenue: number;
  todayOrders: number;
  todayNewCustomers: number;
  percentageChanges: {
    revenue: number;
    orders: number;
    customers: number;
  };
}

// Revenue Analytics Types
export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueStats {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: RevenueDataPoint[];
  comparison: {
    previousPeriod: number;
    percentageChange: number;
  };
}

// Order Analytics Types
export interface OrderStats {
  statusDistribution: {
    [key: string]: number; // e.g., { "pending": 10, "completed": 20 }
  };
  averageOrderValue: number;
  orderTrends: {
    date: string;
    orderCount: number;
  }[];
}

// Product Analytics Types
export interface ProductStats {
  topProducts: ProductStatDetail[];
  categoryDistribution: {
    [category: string]: number;
  };
}

export interface ProductStatDetail {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  sold: number;
  revenue: number;
}

// Customer Analytics Types
export interface CustomerStats {
  newVsReturning: {
    new: number;
    returning: number;
    ratio: number;
  };
  growthTrends: {
    date: string;
    newCustomers: number;
    totalCustomers: number;
  }[];
  topCustomers: CustomerStatDetail[];
}

export interface CustomerStatDetail {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}
