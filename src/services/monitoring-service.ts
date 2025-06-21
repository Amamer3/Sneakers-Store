import apiClient from '@/lib/api-client';
import { SystemLog, HistoricalMetrics, AlertThreshold } from '@/types/system-extended';

export interface MonitoringMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  requests: {
    total: number;
    errors: number;
    averageResponseTime: number;
  };
}

export const monitoringService = {
  // Get historical metrics
  getHistoricalMetrics: async (
    startTime: string,
    endTime: string,
    interval: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<HistoricalMetrics[]> => {
    try {
      console.log('Fetching historical metrics:', { startTime, endTime, interval });
      const response = await apiClient.get<HistoricalMetrics[]>('/monitoring/metrics/historical', {
        params: { startTime, endTime, interval }
      });
      console.log('Historical metrics response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching historical metrics:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Get alert thresholds
  getAlertThresholds: async (): Promise<AlertThreshold[]> => {
    try {
      console.log('Fetching alert thresholds');
      const response = await apiClient.get<AlertThreshold[]>('/monitoring/alerts/thresholds');
      console.log('Alert thresholds response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching alert thresholds:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Get system logs
  getSystemLogs: async (
    limit: number = 100,
    offset: number = 0,
    level?: SystemLog['level'],
    source?: string,
    startTime?: string,
    endTime?: string
  ): Promise<{ logs: SystemLog[]; total: number }> => {
    try {
      console.log('Fetching system logs:', { limit, offset, level, source, startTime, endTime });
      const response = await apiClient.get<{ logs: SystemLog[]; total: number }>('/monitoring/logs', {
        params: { limit, offset, level, source, startTime, endTime }
      });
      console.log('System logs response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching system logs:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  }
};