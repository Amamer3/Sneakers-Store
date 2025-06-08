import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { HistoricalMetrics } from '@/types/system-extended';

interface MetricChartProps {
  data: HistoricalMetrics[];
  metric: string;
  name: string;
  color: string;
}

const MetricChart: React.FC<MetricChartProps> = ({ data, metric, name, color }) => {
  const getValue = (item: HistoricalMetrics, path: string) => {
    return path.split('.').reduce((obj, key) => obj?.[key], item.metrics);
  };

  const chartData = data.map((item) => ({
    timestamp: item.timestamp,
    value: getValue(item, metric),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => format(parseISO(ts), 'HH:mm')}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(ts) => format(parseISO(ts as string), 'MMM d, HH:mm')}
          formatter={(value) => [value, name]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          name={name}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

interface HistoricalMetricsViewerProps {
  data: HistoricalMetrics[];
  onIntervalChange: (interval: 'minute' | 'hour' | 'day') => void;
}

const HistoricalMetricsViewer: React.FC<HistoricalMetricsViewerProps> = ({
  data,
  onIntervalChange,
}) => {
  const metrics = [
    { path: 'cpu.usage', name: 'CPU Usage', color: '#3b82f6' },
    { path: 'memory.usagePercent', name: 'Memory Usage', color: '#8b5cf6' },
    { path: 'requests.requestsPerMinute', name: 'Requests/min', color: '#10b981' },
    { path: 'database.queryLatency', name: 'DB Latency', color: '#f59e0b' },
    { path: 'cache.hitRate', name: 'Cache Hit Rate', color: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Historical Metrics</h3>
        <Select
          defaultValue="hour"
          onValueChange={(value) => onIntervalChange(value as 'minute' | 'hour' | 'day')}
        >
          <option value="minute">Per Minute</option>
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.path}>
            <CardHeader>
              <CardTitle>{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricChart
                data={data}
                metric={metric.path}
                name={metric.name}
                color={metric.color}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoricalMetricsViewer;
