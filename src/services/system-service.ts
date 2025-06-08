import api from './api';
import { wsService } from './websocket-service';
import { SystemHealth, SystemMetrics } from '@/types/system';
import {
  SystemLog,
  HistoricalMetrics,
  AlertThreshold,
  Alert,
  DetailedSystemMetrics
} from '@/types/system-extended';

// Health and basic metrics
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const { data } = await api.get('/api/health');
  return data;
};

export const getSystemMetrics = async (): Promise<DetailedSystemMetrics> => {
  const { data } = await api.get('/metrics');
  return data;
};

// Historical metrics
export const getHistoricalMetrics = async (
  startTime: string,
  endTime: string,
  interval: 'minute' | 'hour' | 'day' = 'hour'
): Promise<HistoricalMetrics[]> => {
  const { data } = await api.get('/metrics/historical', {
    params: { startTime, endTime, interval }
  });
  return data;
};

// Logs
export const getSystemLogs = async (
  limit: number = 100,
  offset: number = 0,
  level?: SystemLog['level'],
  source?: string,
  startTime?: string,
  endTime?: string
): Promise<{ logs: SystemLog[]; total: number }> => {
  const { data } = await api.get('/logs', {
    params: { limit, offset, level, source, startTime, endTime }
  });
  return data;
};

// Alert thresholds
export const getAlertThresholds = async (): Promise<AlertThreshold[]> => {
  const { data } = await api.get('/alerts/thresholds');
  return data;
};

export const createAlertThreshold = async (threshold: Omit<AlertThreshold, 'id'>): Promise<AlertThreshold> => {
  const { data } = await api.post('/alerts/thresholds', threshold);
  return data;
};

export const updateAlertThreshold = async (threshold: AlertThreshold): Promise<AlertThreshold> => {
  const { data } = await api.put(`/alerts/thresholds/${threshold.id}`, threshold);
  return data;
};

export const deleteAlertThreshold = async (id: string): Promise<void> => {
  await api.delete(`/alerts/thresholds/${id}`);
};

// Alerts
export const getAlerts = async (
  limit: number = 100,
  offset: number = 0,
  severity?: AlertThreshold['severity'],
  acknowledged?: boolean,
  startTime?: string,
  endTime?: string
): Promise<{ alerts: Alert[]; total: number }> => {
  const { data } = await api.get('/alerts', {
    params: { limit, offset, severity, acknowledged, startTime, endTime }
  });
  return data;
};

export const acknowledgeAlert = async (id: string): Promise<Alert> => {
  const { data } = await api.post(`/alerts/${id}/acknowledge`);
  return data;
};

// Real-time updates
export const subscribeToMetrics = (callback: (metrics: DetailedSystemMetrics) => void) => {
  wsService.subscribe('metrics', callback);
  wsService.send('subscribe', { type: 'metrics' });
  return () => wsService.unsubscribe('metrics', callback);
};

export const subscribeToLogs = (callback: (log: SystemLog) => void) => {
  wsService.subscribe('logs', callback);
  wsService.send('subscribe', { type: 'logs' });
  return () => wsService.unsubscribe('logs', callback);
};

export const subscribeToAlerts = (callback: (alert: Alert) => void) => {
  wsService.subscribe('alerts', callback);
  wsService.send('subscribe', { type: 'alerts' });
  return () => wsService.unsubscribe('alerts', callback);
};

/**
 * Helper function to check if the system is healthy
 * Returns true if status is 'healthy', false otherwise
 */
export const isSystemHealthy = async (): Promise<boolean> => {
  try {
    const health = await getSystemHealth();
    return health.status === 'healthy';
  } catch (error) {
    return false;
  }
};

/**
 * Helper function to format memory sizes
 * @param bytes Memory size in bytes
 * @returns Formatted string (e.g., "1.5 GB")
 */
export const formatMemorySize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Helper function to format duration
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "2d 5h 30m")
 */
export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '0m';
};
