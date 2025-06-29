import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationContext';
import { Package, ShoppingBag, AlertCircle, Info } from 'lucide-react';

const NotificationDemo: React.FC = () => {
  const { addNotification } = useNotifications();

  const demoNotifications = [
    {
      type: 'order_update' as const,
      title: 'Order Shipped',
      message: 'Your order #12345 has been shipped and is on its way!',
      data: {
        orderId: 'order_12345',
        orderNumber: 'ORD-12345',
        newStatus: 'shipped'
      },
      actionUrl: '/orders/12345'
    },
    {
      type: 'promotion' as const,
      title: 'Flash Sale Alert',
      message: '50% off on all sneakers! Limited time offer ending soon.',
      data: {
        discountPercent: 50,
        category: 'sneakers'
      },
      actionUrl: '/products?category=sneakers'
    },
    {
      type: 'system' as const,
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2-4 AM EST.',
      data: {
        maintenanceStart: '2024-01-15T02:00:00Z',
        maintenanceEnd: '2024-01-15T04:00:00Z'
      }
    },
    {
      type: 'message' as const,
      title: 'Welcome!',
      message: 'Thank you for joining KicksIntel. Explore our latest collection!',
      data: {
        welcomeBonus: true
      },
      actionUrl: '/products'
    }
  ];

  const handleSendNotification = (notification: typeof demoNotifications[0]) => {
    addNotification({
      id: Date.now().toString(),
      userId: 'demo_user',
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      priority: 'medium',
      channel: 'push',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: notification.actionUrl
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <Package className="h-4 w-4" />;
      case 'promotion':
        return <ShoppingBag className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      case 'message':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Notification System Demo
        </CardTitle>
        <CardDescription>
          Test the real-time notification system. Click the buttons below to simulate different types of notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {demoNotifications.map((notification, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex items-center gap-2 h-auto p-4 text-left justify-start"
              onClick={() => handleSendNotification(notification)}
            >
              {getIcon(notification.type)}
              <div className="flex flex-col">
                <span className="font-medium text-sm">{notification.title}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {notification.message}
                </span>
              </div>
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
          <strong>How it works:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Notifications appear in the bell icon in the navbar (for authenticated users)</li>
            <li>Real-time updates via WebSocket connection</li>
            <li>Toast notifications for immediate alerts</li>
            <li>Persistent notification history with read/unread status</li>
            <li>Sound notifications for important updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDemo;