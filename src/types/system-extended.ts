import { SystemMetrics, SystemHealth } from './system';

export type { SystemMetrics, SystemHealth };

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface HistoricalMetrics {
  timestamp: string;
  metrics: SystemMetrics;
}

export interface AlertThreshold {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifyChannels: ('email' | 'slack' | 'webhook')[];
}

export interface Alert {
  id: string;
  timestamp: string;
  thresholdId: string;
  metric: string;
  value: number;
  message: string;
  severity: AlertThreshold['severity'];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// Extend existing SystemMetrics with more detailed breakdowns
export interface DetailedSystemMetrics extends SystemMetrics {
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: {
      total: number;
      perIp: Record<string, number>;
    };
    latency: {
      min: number;
      max: number;
      avg: number;
      p95: number;
      p99: number;
    };
  };
  endpoints: {
    [path: string]: {
      requests: number;
      averageResponseTime: number;
      errorRate: number;
      statusCodes: Record<string, number>;
    };
  };
  database: SystemMetrics['database'] & {
    queries: {
      total: number;
      slow: number;
      cached: number;
      types: Record<string, number>; // SELECT, INSERT, etc.
    };
    tables: {
      [name: string]: {
        rows: number;
        size: number;
        lastVacuum?: string;
        scanRate: number;
      };
    };
  };
  cache: SystemMetrics['cache'] & {
    keys: number;
    expired: number;
    evicted: number;
    memoryFragmentation: number;
  };
  queue: {
    jobs: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    processingTime: {
      avg: number;
      p95: number;
    };
    errorRate: number;
  };
}
