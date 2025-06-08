export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  message?: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  requests: {
    total: number;
    activeConnections: number;
    requestsPerMinute: number;
    averageResponseTime: number;
  };
  database: {
    connectionPool: {
      total: number;
      active: number;
      idle: number;
    };
    queryLatency: number;
    activeTransactions: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  errors: {
    count: number;
    rate: number;
    lastError?: {
      message: string;
      timestamp: string;
    };
  };
}
