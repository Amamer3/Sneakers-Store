import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  RefreshCw,
  LucideIcon,
  LucideProps
} from 'lucide-react';
import { dashboardService } from '@/services/dashboard-service';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import React from 'react';

interface StatCard {
  title: string;
  value: string;
  icon: LucideIcon | React.FC;
  trend: string;
  color: string;
  bgColor: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { isAdmin, isAuthenticated } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const formatValue = (value: number | undefined, type: 'currency' | 'number' = 'number'): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return type === 'currency' ? formatPrice(0) : '0';
    }
    
    if (type === 'currency') {
      return formatPrice(value);
    }
    
    return value.toLocaleString();
  };

  const GHSSymbol: React.FC = () => (
    <span className="font-bold text-green-600">₵</span>
  );

  const loadDashboardData = useCallback(async (isRetry: boolean = false) => {
    if (!isAuthenticated || !isAdmin) {
      setError('You must be logged in as an admin to view the dashboard');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading dashboard data...');
      setLoading(true);
      setError(null);

      const [statsData, ordersData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentOrders()
      ]);

      console.log('Received stats data:', statsData);
      
      // Ensure we have valid stats data
      if (!statsData) {
        throw new Error('No statistics data received');
      }

      const newStats: StatCard[] = [
        {
          title: "Total Revenue",
          value: formatValue(statsData.totalRevenue, 'currency'),
          icon: currency === 'GHS' ? GHSSymbol : DollarSign,
          trend: statsData.revenueGrowth,
          color: statsData.revenueGrowth.startsWith('+') ? "text-green-600" : "text-red-600",
          bgColor: statsData.revenueGrowth.startsWith('+') ? "bg-green-100" : "bg-red-100"
        },
        {
          title: "Total Orders",
          value: formatValue(statsData.totalOrders),
          icon: ShoppingBag,
          trend: statsData.ordersGrowth,
          color: statsData.ordersGrowth.startsWith('+') ? "text-blue-600" : "text-red-600",
          bgColor: statsData.ordersGrowth.startsWith('+') ? "bg-blue-100" : "bg-red-100"
        },
        {
          title: "Total Products",
          value: formatValue(statsData.totalProducts),
          icon: Package,
          trend: statsData.productsGrowth,
          color: statsData.productsGrowth.startsWith('+') ? "text-purple-600" : "text-red-600",
          bgColor: statsData.productsGrowth.startsWith('+') ? "bg-purple-100" : "bg-red-100"
        },
        {
          title: "Total Customers",
          value: formatValue(statsData.totalCustomers),
          icon: Users,
          trend: statsData.customersGrowth,
          color: statsData.customersGrowth.startsWith('+') ? "text-orange-600" : "text-red-600",
          bgColor: statsData.customersGrowth.startsWith('+') ? "bg-orange-100" : "bg-red-100"
        }
      ];

      console.log('Setting new stats:', newStats);
      setStats(newStats);
      setRecentOrders(ordersData || []);
      setRetryCount(0);
    } catch (err: any) {
      console.error('Dashboard loading error:', err);
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load dashboard data';
      
      if (err?.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err?.response?.status === 403) {
        setError('You do not have permission to view the dashboard.');
      } else if (!isRetry && retryCount < 3) {
        console.log('Retrying... Attempt:', retryCount + 1);
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadDashboardData(true), 1000 * (retryCount + 1));
        return;
      } else {
        setError('Failed to load dashboard data. Please try again later or contact support if the problem persists.');
      }

      toast({
        title: 'Error Loading Dashboard',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, retryCount, toast, formatPrice, currency]);

  // Initial load and refresh interval
  useEffect(() => {
    console.log('Dashboard useEffect running, auth status:', { isAuthenticated, isAdmin });
    let intervalId: number;

    const initDashboard = async () => {
      await loadDashboardData();
      // Set up refresh interval only if authenticated and admin
      if (isAuthenticated && isAdmin) {
        intervalId = window.setInterval(() => {
          loadDashboardData();
        }, 5 * 60 * 1000); // Refresh every 5 minutes
      }
    };

    initDashboard();

    // Cleanup
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [loadDashboardData, isAuthenticated, isAdmin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button
          variant="outline"
          onClick={() => loadDashboardData()}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Refresh</span>
            </div>
          )}
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <span className="ml-3 text-red-700">{error}</span>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => loadDashboardData()}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <Badge 
                      className={`${stat.bgColor} ${stat.color} mt-2`}
                      variant="secondary"
                    >
                      {stat.trend}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Recent Orders section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.customer.name} • {order.customer.email}
                      </p>
                      <Badge 
                        variant={order.status === 'delivered' ? 'default' : 
                               order.status === 'pending' ? 'secondary' : 
                               order.status === 'cancelled' ? 'destructive' : 
                               'outline'}
                        className="mt-2"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <p className="text-sm text-gray-500">{order.items?.length || 0} items</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
