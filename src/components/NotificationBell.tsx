import React, { useState } from 'react';
import { Bell, X, Check, Package, ShoppingBag, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  id: string;
  type: 'order_update' | 'promotion' | 'system' | 'message' | 'reminder' | 'security';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  isRead,
  actionUrl,
  onMarkAsRead,
  onRemove,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'order_update':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'promotion':
        return <ShoppingBag className="h-4 w-4 text-green-600" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'security':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-purple-600" />;
      case 'message':
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    if (isRead) return 'bg-gray-50';
    switch (type) {
      case 'order_update':
        return 'bg-blue-50';
      case 'promotion':
        return 'bg-green-50';
      case 'system':
        return 'bg-orange-50';
      case 'security':
        return 'bg-red-50';
      case 'reminder':
        return 'bg-purple-50';
      case 'message':
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className={`p-3 border-b border-gray-100 ${getBgColor()} hover:bg-gray-100 transition-colors duration-200`}>
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="mt-1">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                {title}
              </h4>
              {!isRead && (
                <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0" />
              )}
            </div>
            <p className={`text-xs mt-1 ${isRead ? 'text-gray-500' : 'text-gray-600'}`}>
              {message}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
              {actionUrl && (
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                  View Details
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {!isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(id)}
              className="h-6 w-6 p-0 hover:bg-blue-100"
              title="Mark as read"
            >
              <Check className="h-3 w-3 text-blue-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(id)}
            className="h-6 w-6 p-0 hover:bg-red-100"
            title="Remove notification"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    loadMoreNotifications,
    refreshNotifications,
    showUnreadOnly,
    setShowUnreadOnly,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-gray-200/80 backdrop-blur-sm"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold bg-red-500 hover:bg-red-600"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 rounded-xl shadow-lg bg-white/95 backdrop-blur-sm border border-gray-200/50"
        sideOffset={8}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`text-xs px-2 py-1 ${
                    showUnreadOnly 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {showUnreadOnly ? 'Show all' : 'Unread only'}
                </Button>
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notifications yet</p>
            <p className="text-gray-400 text-xs mt-1">
              You'll see order updates and promotions here
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                timestamp={notification.createdAt}
                isRead={notification.read}
                actionUrl={notification.actionUrl}
                onMarkAsRead={markAsRead}
                onRemove={deleteNotification}
              />
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="p-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreNotifications}
                  disabled={loading}
                  className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {loading ? 'Loading...' : 'Load more notifications'}
                </Button>
              </div>
            )}
            
            {/* Refresh Button */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshNotifications}
                  disabled={loading}
                  className="w-full text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh notifications'}
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;