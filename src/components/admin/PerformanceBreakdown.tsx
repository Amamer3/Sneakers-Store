import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DetailedSystemMetrics } from '@/types/system-extended';
import { formatMemorySize } from '@/services/system-service';

interface PerformanceBreakdownProps {
  metrics: DetailedSystemMetrics;
}

const PerformanceBreakdown: React.FC<PerformanceBreakdownProps> = ({ metrics }) => {
  // Helper function to format latency
  const formatLatency = (ms: number) => `${ms.toFixed(2)}ms`;

  // Helper function to format percentage
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Performance Breakdown</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Network Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Network Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Latency (p95)</span>
                <span>{formatLatency(metrics.network.latency.p95)}</span>
              </div>
              <Progress value={
                (metrics.network.latency.p95 / metrics.network.latency.max) * 100
              } />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Connections</span>
                <span>{metrics.network.connections.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Throughput</span>
                <span>{formatMemorySize(metrics.network.bytesIn + metrics.network.bytesOut)}/s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Database Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Query Cache Rate</span>
                <span>{formatPercentage(metrics.database.queries.cached / metrics.database.queries.total)}</span>
              </div>
              <Progress value={
                (metrics.database.queries.cached / metrics.database.queries.total) * 100
              } />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Transactions</span>
                <span>{metrics.database.activeTransactions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Slow Queries</span>
                <span>{metrics.database.queries.slow}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Connection Pool</span>
                <span>{metrics.database.connectionPool.active}/{metrics.database.connectionPool.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Hit Rate</span>
                <span>{formatPercentage(metrics.cache.hitRate)}</span>
              </div>
              <Progress value={metrics.cache.hitRate * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{formatMemorySize(metrics.cache.size)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Keys</span>
                <span>{metrics.cache.keys}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Evicted</span>
                <span>{metrics.cache.evicted}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Success Rate</span>
                <span>{formatPercentage(1 - metrics.queue.errorRate)}</span>
              </div>
              <Progress value={(1 - metrics.queue.errorRate) * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Jobs</span>
                <span>{metrics.queue.jobs.active}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Waiting Jobs</span>
                <span>{metrics.queue.jobs.waiting}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing Time (p95)</span>
                <span>{formatLatency(metrics.queue.processingTime.p95)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint Performance */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Endpoint Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Endpoint</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Requests</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Avg Response</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Error Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(metrics.endpoints).map(([path, stats]) => (
                    <tr key={path}>
                      <td className="px-4 py-2 text-sm font-medium">{path}</td>
                      <td className="px-4 py-2 text-sm">{stats.requests}</td>
                      <td className="px-4 py-2 text-sm">{formatLatency(stats.averageResponseTime)}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          stats.errorRate > 0.05 ? 'bg-red-100 text-red-800' :
                          stats.errorRate > 0.01 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {formatPercentage(stats.errorRate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceBreakdown;
