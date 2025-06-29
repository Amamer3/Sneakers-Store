import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export interface Notification {
  id: string;
  type: 'order_update' | 'promotion' | 'system' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  orderId?: string;
  userId?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean };

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications].slice(0, 50); // Keep only latest 50
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.isRead).length,
      };
    }
    case 'MARK_AS_READ': {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, isRead: true }
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };
    }
    case 'MARK_ALL_AS_READ': {
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: 0,
      };
    }
    case 'REMOVE_NOTIFICATION': {
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.isRead).length,
      };
    }
    case 'CLEAR_ALL_NOTIFICATIONS': {
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    }
    case 'SET_NOTIFICATIONS': {
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
      };
    }
    case 'SET_CONNECTION_STATUS': {
      return {
        ...state,
        isConnected: action.payload,
      };
    }
    default:
      return state;
  }
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Notification WebSocket connected');
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
          reconnectAttempts = 0;

          // Send authentication token
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          if (token && user) {
            ws?.send(JSON.stringify({
              type: 'auth',
              token,
              userId: user.id,
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification') {
              const notification: Notification = {
                id: data.id || generateId(),
                type: data.notificationType || 'general',
                title: data.title,
                message: data.message,
                timestamp: new Date(data.timestamp || Date.now()),
                isRead: false,
                orderId: data.orderId,
                userId: data.userId,
                priority: data.priority || 'medium',
              };

              dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

              // Show toast for high priority notifications
              if (notification.priority === 'high') {
                toast({
                  title: notification.title,
                  description: notification.message,
                  duration: 5000,
                });
              }

              // Play notification sound for order updates
              if (notification.type === 'order_update') {
                playNotificationSound();
              }
            }
          } catch (error) {
            console.error('Error parsing notification message:', error);
          }
        };

        ws.onclose = () => {
          console.log('Notification WebSocket disconnected');
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });

          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            reconnectTimeout = setTimeout(connectWebSocket, reconnectDelay * reconnectAttempts);
          }
        };

        ws.onerror = (error) => {
          console.error('Notification WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to connect to notification WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [isAuthenticated, user]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (savedNotifications) {
        try {
          const notifications = JSON.parse(savedNotifications).map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
          dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
        } catch (error) {
          console.error('Error loading saved notifications:', error);
        }
      }
    }
  }, [isAuthenticated, user]);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (isAuthenticated && user && state.notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(state.notifications));
    }
  }, [state.notifications, isAuthenticated, user]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      isRead: false,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  };

  const value: NotificationContextType = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isConnected: state.isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Utility functions
const generateId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const playNotificationSound = () => {
  try {
    // Create a subtle notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Fallback: no sound if audio context fails
    console.log('Notification sound not available');
  }
};

export default NotificationProvider;