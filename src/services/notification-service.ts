import apiClient from '@/lib/api-client';

// Type definitions for notification types and priorities
export type NotificationType = 'order_status' | 'payment' | 'shipping' | 'promotion' | 'system' | 'inventory' | 'security';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

// Enum-like objects for use in components
export const NotificationTypes = {
  ORDER_STATUS: 'order_status' as const,
  PAYMENT: 'payment' as const,
  SHIPPING: 'shipping' as const,
  PROMOTION: 'promotion' as const,
  SYSTEM: 'system' as const,
  INVENTORY: 'inventory' as const,
  SECURITY: 'security' as const,
  GENERAL: 'system' as const, // Map GENERAL to system
  ORDER: 'order_status' as const // Map ORDER to order_status
} as const;

export const NotificationPriorities = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  URGENT: 'urgent' as const
} as const;

export const NotificationChannels = {
  IN_APP: 'in_app' as const,
  EMAIL: 'email' as const,
  SMS: 'sms' as const,
  PUSH: 'push' as const
} as const;

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: NotificationPriority;
  channel: NotificationChannel;
  actionUrl?: string; // Optional URL for notification actions
  createdAt: string | Date;
  readAt?: string | Date;
  expiresAt?: string | Date;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: {
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
    securityAlerts: boolean;
  };
  smsNotifications: {
    orderUpdates: boolean;
    deliveryAlerts: boolean;
    securityAlerts: boolean;
  };
  pushNotifications: {
    orderUpdates: boolean;
    promotions: boolean;
    inventory: boolean;
    general: boolean;
  };
  inAppNotifications: {
    all: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    system: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  readRate: number; // Percentage of notifications that have been read (0-1)
  totalSent?: number; // Total number of notifications sent (all time)
  delivered?: number; // Number of successfully delivered notifications
  failed?: number; // Number of failed notification deliveries
  read?: number; // Number of read notifications
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  content: string;
  variables: string[];
  channels: string[];
  active: boolean;
}

interface NotificationServiceInterface {
  // User notifications
  getNotifications(page?: number, limit?: number, type?: string): Promise<{
    notifications: Notification[];
    total: number;
    unread: number;
  }>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getNotificationStats(): Promise<NotificationStats>;
  
  // Preferences
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  
  // Push notifications
  subscribeToPush(subscription: PushSubscription): Promise<void>;
  unsubscribeFromPush(): Promise<void>;
  testPushNotification(): Promise<void>;
  
  // Admin functions
  sendNotification(notification: {
    userIds?: string[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: string;
    channels?: string[];
  }): Promise<void>;
  broadcastNotification(notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: string;
    channels?: string[];
    userFilter?: Record<string, any>;
  }): Promise<void>;
  getNotificationTemplates(): Promise<NotificationTemplate[]>;
  createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate>;
  updateTemplate(id: string, template: Partial<NotificationTemplate>): Promise<NotificationTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Real-time connection
  connect(): void;
  disconnect(): void;
  onNotification(callback: (notification: Notification) => void): () => void;
}

class NotificationService implements NotificationServiceInterface {
  private eventSource: EventSource | null = null;
  private listeners: ((notification: Notification) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Get user notifications with pagination
  async getNotifications(page: number = 1, limit: number = 20, type?: string): Promise<{
    notifications: Notification[];
    total: number;
    unread: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(type && { type })
      });
      
      const response = await apiClient.get(`/notifications?${params}`);
      return {
        notifications: response.data.items || response.data.notifications || [],
        total: response.data.total || 0,
        unread: response.data.unread || 0
      };
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete notification');
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await apiClient.get('/notifications/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notification statistics');
    }
  }

  // Get user notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get('/notifications/preferences');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notification preferences');
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      throw new Error(error.response?.data?.message || 'Failed to update notification preferences');
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(subscription: PushSubscription): Promise<void> {
    try {
      await apiClient.post('/notifications/push/subscribe', subscription);
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      throw new Error(error.response?.data?.message || 'Failed to subscribe to push notifications');
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<void> {
    try {
      await apiClient.delete('/notifications/push/unsubscribe');
    } catch (error: any) {
      console.error('Error unsubscribing from push notifications:', error);
      throw new Error(error.response?.data?.message || 'Failed to unsubscribe from push notifications');
    }
  }

  // Test push notification
  async testPushNotification(): Promise<void> {
    try {
      await apiClient.post('/notifications/push/test');
    } catch (error: any) {
      console.error('Error sending test push notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to send test push notification');
    }
  }

  // Admin: Send notification to specific users
  async sendNotification(notification: {
    userIds?: string[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: string;
    channels?: string[];
  }): Promise<void> {
    try {
      await apiClient.post('/admin/notifications/send', notification);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to send notification');
    }
  }

  // Admin: Broadcast notification to all users or filtered users
  async broadcastNotification(notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: string;
    channels?: string[];
    userFilter?: Record<string, any>;
  }): Promise<void> {
    try {
      await apiClient.post('/admin/notifications/broadcast', notification);
    } catch (error: any) {
      console.error('Error broadcasting notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to broadcast notification');
    }
  }

  // Admin: Get notification templates
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    try {
      const response = await apiClient.get('/admin/notifications/templates');
      return response.data.items || response.data;
    } catch (error: any) {
      console.error('Error fetching notification templates:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notification templates');
    }
  }

  // Admin: Create notification template
  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    try {
      const response = await apiClient.post('/admin/notifications/templates', template);
      return response.data;
    } catch (error: any) {
      console.error('Error creating notification template:', error);
      throw new Error(error.response?.data?.message || 'Failed to create notification template');
    }
  }

  // Admin: Update notification template
  async updateTemplate(id: string, template: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const response = await apiClient.put(`/admin/notifications/templates/${id}`, template);
      return response.data;
    } catch (error: any) {
      console.error('Error updating notification template:', error);
      throw new Error(error.response?.data?.message || 'Failed to update notification template');
    }
  }

  // Admin: Delete notification template
  async deleteTemplate(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/notifications/templates/${id}`);
    } catch (error: any) {
      console.error('Error deleting notification template:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete notification template');
    }
  }

  // Connect to real-time notifications
  connect(): void {
    if (this.eventSource) {
      return; // Already connected
    }

    try {
      // Get auth token for SSE connection
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found for notification connection');
        return;
      }

      this.eventSource = new EventSource(`/api/notifications/stream?token=${token}`);
      
      this.eventSource.onopen = () => {
        console.log('Notification stream connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.listeners.forEach(callback => callback(notification));
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.eventSource.onerror = () => {
        console.error('Notification stream error');
        this.disconnect();
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Error connecting to notification stream:', error);
      this.scheduleReconnect();
    }
  }

  // Disconnect from real-time notifications
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  // Subscribe to notification events
  onNotification(callback: (notification: Notification) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;