import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Loader2, CheckCircle, 
  AlertTriangle, AlertCircle, Calendar as CalendarIcon, RefreshCcw, Download 
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { wsService } from '@/services/websocket-service';
import LogViewer from '@/components/admin/LogViewer';
import ThresholdConfig from '@/components/admin/ThresholdConfig';
import HistoricalMetricsViewer from '@/components/admin/HistoricalMetricsViewer';
import PerformanceBreakdown from '@/components/admin/PerformanceBreakdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';
import {
  getOverviewStats,
  getRevenueStats,
  getProductsByCategory
} from '@/services/analytics-service';
import {
  getSystemHealth,
  getSystemMetrics,
  getHistoricalMetrics,
  getSystemLogs,
  getAlertThresholds,
  createAlertThreshold,
  updateAlertThreshold,
  deleteAlertThreshold,
  subscribeToMetrics,
  subscribeToLogs,
  subscribeToAlerts
} from '@/services/system-service';
import type { OverviewStats, RevenueStats } from '@/services/analytics-service';
import {
  SystemHealth,
  DetailedSystemMetrics,
  SystemLog,
  HistoricalMetrics as HistoricalMetricsType,
  AlertThreshold,
  Alert,
  SystemMetrics
} from '@/types/system-extended';

// Interfaces
interface ChartData {
  name: string;
  value: number;
  color: string;
  payload?: {
    date: string;
    [key: string]: any;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartData[];
  label?: string;
}

interface AnalyticsState {
  overviewStats: OverviewStats | null;
  revenueData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  categoryData: Array<{
    name: string;
    value: number;
  }>;
  dateRange: {
    from: Date;
    to: Date;
  };
}

const INITIAL_STATE: AnalyticsState = {
  overviewStats: null,
  revenueData: [],
  categoryData: [],
  dateRange: {
    from: subMonths(new Date(), 1),
    to: new Date()
  }
};

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AnalyticsState>(INITIAL_STATE);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [historicalMetrics, setHistoricalMetrics] = useState<HistoricalMetricsType[]>([]);
  const [detailedMetrics, setDetailedMetrics] = useState<DetailedSystemMetrics | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [metricsInterval, setMetricsInterval] = useState<'minute' | 'hour' | 'day'>('hour');

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, revenue, productStats, health, metrics] = await Promise.all([
        getOverviewStats(),
        getRevenueStats(
          'monthly',
          format(dateRange.from, 'yyyy-MM-dd'),
          format(dateRange.to, 'yyyy-MM-dd')
        ),
        getProductsByCategory(),
        getSystemHealth(),
        getSystemMetrics()
      ]);

      setState(prev => ({
        ...prev,
        overviewStats: stats,
        revenueData: revenue.data.map(item => ({
          date: item.date,
          revenue: item.revenue,
          orders: item.orders
        })),
        categoryData: Array.isArray(productStats) ? productStats.map(item => ({
          name: item.categoryName,
          value: item.productCount
        })) : []
      }));
      setSystemHealth(health);
      setSystemMetrics(metrics);
    } catch (error) {
      setError('Failed to load analytics data.');
      console.error('Analytics data fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: 'ease-out-quart',
      delay: 100,
    });
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const metricsUnsub = subscribeToMetrics((metrics) => {
      setDetailedMetrics(metrics);
    });

    const logsUnsub = subscribeToLogs((log) => {
      setLogs((prev) => [log, ...prev].slice(0, 100));
    });

    const alertsUnsub = subscribeToAlerts((alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    const loadData = async () => {
      try {
        const [thresholdsData, logsData, historicalData] = await Promise.all([
          getAlertThresholds(),
          getSystemLogs(),
          getHistoricalMetrics(
            format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
            format(new Date(), 'yyyy-MM-dd'),
            metricsInterval
          ),
        ]);

        setThresholds(thresholdsData);
        setLogs(logsData.logs);
        setHistoricalMetrics(historicalData);
      } catch (error) {
        console.error('Error loading monitoring data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load monitoring data.',
          variant: 'destructive',
        });
      }
    };

    loadData();

    return () => {
      metricsUnsub();
      logsUnsub();
      alertsUnsub();
    };
  }, [metricsInterval, toast]);

  useEffect(() => {
    wsService.connect();
    const handleMetricUpdate = (data: any) => {
      if (data.type === 'system-metrics') {
        setSystemMetrics(prev => ({
          ...prev,
          ...data.metrics
        }));
      }
    };

    wsService.subscribe('metrics-update', handleMetricUpdate);
    return () => {
      wsService.unsubscribe('metrics-update', handleMetricUpdate);
      wsService.disconnect();
    };
  }, []);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleExport = () => {
    const exportData = {
      overview: state.overviewStats,
      revenueData: state.revenueData,
      categoryDistribution: state.categoryData,
      exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      dateRange: {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getHealthStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const handleThresholdChange = (threshold: AlertThreshold) => {
    updateAlertThreshold(threshold).catch(error => {
      console.error('Error updating threshold:', error);
      toast({
        title: 'Error',
        description: 'Failed to update threshold.',
        variant: 'destructive',
      });
    });
  };

  const handleThresholdDelete = (id: string) => {
    deleteAlertThreshold(id)
      .then(() => {
        setThresholds(prev => prev.filter(t => t.id !== id));
        toast({
          title: 'Success',
          description: 'Threshold deleted.',
        });
      })
      .catch(error => {
        console.error('Error deleting threshold:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete threshold.',
          variant: 'destructive',
        });
      });
  };

  const handleThresholdAdd = (threshold: Omit<AlertThreshold, 'id'>) => {
    createAlertThreshold(threshold)
      .then((newThreshold) => {
        setThresholds(prev => [...prev, newThreshold]);
        toast({
          title: 'Success',
          description: 'Threshold added.',
        });
      })
      .catch(error => {
        console.error('Error adding threshold:', error);
        toast({
          title: 'Error',
          description: 'Failed to add threshold.',
          variant: 'destructive',
        });
      });
  };

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700">
          <p className="text-sm font-semibold mb-2 text-gray-100">
            {label ? format(new Date(label), 'MMM d, yyyy') : payload[0]?.payload?.name}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="text-sm text-gray-300">
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>{' '}
              {entry.name.toLowerCase().includes('revenue') ? formatPrice(entry.value) : entry.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleIntervalChange = (newInterval: 'minute' | 'hour' | 'day') => {
    setMetricsInterval(newInterval);
    getHistoricalMetrics(
      format(dateRange.from, 'yyyy-MM-dd'),
      format(dateRange.to, 'yyyy-MM-dd'),
      newInterval
    ).then(setHistoricalMetrics).catch(error => {
      console.error('Error fetching historical metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load historical metrics.',
        variant: 'destructive',
      });
    });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      setDateRange(prev => ({
        ...prev,
        from: range.from!,
        to: range.to || prev.to
      }));
    }
  };

  const healthStatusToBadgeVariant = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'unhealthy':
        return 'destructive';
      case 'degraded':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const renderMetricsSection = () => {
    if (!systemMetrics || !detailedMetrics) return null;

    return (
      <Card className="bg-gray-800 border-gray-700 hover:shadow-xl transition-shadow duration-300" data-aos="fade-up">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-gray-100 text-xl">
            <span>System Metrics</span>
            <Badge variant={healthStatusToBadgeVariant(systemHealth?.status || 'degraded')}>
              {getHealthStatusIcon(systemHealth?.status || 'degraded')}
              <span className="ml-2">{systemHealth?.status || 'Unknown'}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PerformanceBreakdown metrics={detailedMetrics} />
          <HistoricalMetricsViewer 
            data={historicalMetrics}
            onIntervalChange={handleIntervalChange} 
          />
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-lg">{error}</p>
            </div>
            <Button 
              onClick={() => { setError(null); fetchData(); }} 
              className="mt-6 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <p className="text-lg text-gray-100">Loading analytics data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-aos="fade-down">
        <h1 className="text-2xl font-bold text-gray-100">Analytics Dashboard</h1>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="border-gray-600 hover:bg-gray-800 text-gray-100"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                initialFocus
                className="bg-gray-800 text-gray-100"
              />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleRefresh} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleExport} 
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {state.overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-aos="fade-up">
          <Card className="bg-gray-800 border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-100 mt-1">
                    {formatPrice(state.overviewStats.totalRevenue)}
                  </h3>
                </div>
                <div className="p-2 bg-green-900/50 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {state.overviewStats.revenueGrowth > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`ml-2 text-sm ${
                  state.overviewStats.revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {Math.abs(state.overviewStats.revenueGrowth)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>
          {/* Add more stat cards as needed */}
        </div>
      )}

      {/* Revenue Chart */}
      <Card className="bg-gray-800 border-gray-700 hover:shadow-xl transition-shadow duration-300" data-aos="fade-up" data-aos-delay="100">
        <CardHeader>
          <CardTitle className="text-gray-100 text-xl">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      {renderMetricsSection()}

      {/* Thresholds and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-aos="fade-up" data-aos-delay="200">
        <Card className="bg-gray-800 border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-gray-100 text-xl">Alert Thresholds</CardTitle>
          </CardHeader>
          <CardContent>
            <ThresholdConfig
              thresholds={thresholds}
              onThresholdChange={handleThresholdChange}
              onThresholdDelete={handleThresholdDelete}
              onThresholdAdd={handleThresholdAdd}
            />
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-gray-100 text-xl">System Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <LogViewer logs={logs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;