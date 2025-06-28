import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Send,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Target,
  Zap,
  BarChart3,
  CreditCard,
  Truck,
  Gift,
  Shield,
  ShoppingCart
} from 'lucide-react';
import {
  notificationService,
  Notification,
  NotificationTemplate,
  NotificationStats,
  NotificationType,
  NotificationPriority,
  NotificationTypes,
  NotificationPriorities,
  BulkNotificationData,
  BulkSendResult
} from '@/services/notification-service';

interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  search?: string;
}

interface BroadcastForm {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetAudience: 'all' | 'customers' | 'admins';
  channels: string[];
  scheduledFor?: string;
  actionUrl?: string;
  actionText?: string;
}

interface TemplateForm {
  name: string;
  subject: string;
  content: string;
  type: NotificationType;
  variables: string[];
  channels: string[];
  active: boolean;
}

interface BulkSendForm {
  templateId?: string;
  userIds: string;
  userType: 'customers' | 'admins' | 'all';
  tags: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: string[];
  scheduledFor?: string;
}

const NotificationManagement: React.FC = () => {
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showBulkSendDialog, setShowBulkSendDialog] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState<BroadcastForm>({
    title: '',
    message: '',
    type: NotificationTypes.GENERAL,
    priority: NotificationPriorities.MEDIUM,
    targetAudience: 'all',
    channels: []
  });
  const [templateForm, setTemplateForm] = useState<TemplateForm>({
    name: '',
    subject: '',
    content: '',
    type: NotificationTypes.GENERAL,
    variables: [],
    channels: [],
    active: true
  });
  const [bulkSendForm, setBulkSendForm] = useState<BulkSendForm>({
    userIds: '',
    userType: 'all',
    tags: '',
    title: '',
    message: '',
    type: NotificationTypes.GENERAL,
    priority: NotificationPriorities.MEDIUM,
    channels: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [sending, setSending] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  const fetchNotificationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [notificationsResponse, templatesResponse, statsResponse] = await Promise.allSettled([
        notificationService.getNotifications(1, 50),
        notificationService.getNotificationTemplates(),
        notificationService.getNotificationStats()
      ]);

      if (notificationsResponse.status === 'fulfilled') {
        setNotifications(notificationsResponse.value.notifications || []);
      }

      if (templatesResponse.status === 'fulfilled') {
        setTemplates(templatesResponse.value);
      }

      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value);
      }

    } catch (err: any) {
      console.error('Error fetching notification data:', err);
      setError(err.message || 'Failed to fetch notification data');
      toast({
        title: 'Error',
        description: 'Failed to fetch notification data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  const handleBroadcast = async () => {
    try {
      setSending(true);
      
      if (!broadcastForm.title || !broadcastForm.message) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      await notificationService.broadcastNotification({
        title: broadcastForm.title,
        message: broadcastForm.message,
        type: broadcastForm.type,
        priority: broadcastForm.priority,
        channels: broadcastForm.channels,
        userFilter: { targetAudience: broadcastForm.targetAudience }
      });

      toast({
        title: 'Success',
        description: 'Notification broadcast successfully'
      });

      setShowBroadcastDialog(false);
      resetBroadcastForm();
      fetchNotificationData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to broadcast notification',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!templateForm.name || !templateForm.subject || !templateForm.content) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      await notificationService.createTemplate(templateForm);

      toast({
        title: 'Success',
        description: 'Template created successfully'
      });

      setShowTemplateDialog(false);
      resetTemplateForm();
      fetchNotificationData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create template',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      if (!selectedTemplate || !templateForm.name || !templateForm.subject || !templateForm.content) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      await notificationService.updateTemplate(selectedTemplate.id, templateForm);

      toast({
        title: 'Success',
        description: 'Template updated successfully'
      });

      setShowEditTemplateDialog(false);
      setSelectedTemplate(null);
      resetTemplateForm();
      fetchNotificationData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update template',
        variant: 'destructive'
      });
    }
  };

  const handleBulkSend = async () => {
    try {
      setBulkSending(true);

      if (!bulkSendForm.title || !bulkSendForm.message) {
        toast({
          title: 'Error',
          description: 'Please fill in title and message',
          variant: 'destructive'
        });
        return;
      }

      const bulkData: BulkNotificationData = {
        title: bulkSendForm.title,
        message: bulkSendForm.message,
        type: bulkSendForm.type,
        priority: bulkSendForm.priority,
        channels: bulkSendForm.channels,
        filters: {
          userType: bulkSendForm.userType,
          tags: bulkSendForm.tags ? bulkSendForm.tags.split(',').map(tag => tag.trim()) : undefined
        },
        userIds: bulkSendForm.userIds ? bulkSendForm.userIds.split(',').map(id => id.trim()) : undefined,
        scheduledFor: bulkSendForm.scheduledFor,
        templateId: bulkSendForm.templateId
      };

      const result = await notificationService.sendBulkNotifications(bulkData);

      toast({
        title: 'Success',
        description: `Bulk notifications sent successfully. Sent: ${result.sent}, Failed: ${result.failed}`
      });

      setShowBulkSendDialog(false);
      resetBulkSendForm();
      fetchNotificationData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send bulk notifications',
        variant: 'destructive'
      });
    } finally {
      setBulkSending(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await notificationService.deleteTemplate(templateId);
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
      fetchNotificationData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const resetBroadcastForm = () => {
    setBroadcastForm({
      title: '',
      message: '',
      type: NotificationTypes.GENERAL,
      priority: NotificationPriorities.MEDIUM,
      targetAudience: 'all',
      channels: []
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      content: '',
      type: NotificationTypes.GENERAL,
      variables: [],
      channels: [],
      active: true
    });
  };

  const resetBulkSendForm = () => {
    setBulkSendForm({
      userIds: '',
      userType: 'all',
      tags: '',
      title: '',
      message: '',
      type: NotificationTypes.GENERAL,
      priority: NotificationPriorities.MEDIUM,
      channels: []
    });
  };

  const openEditTemplateDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
      variables: template.variables || [],
      channels: template.channels || [],
      active: template.active
    });
    setShowEditTemplateDialog(true);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'order_status': return <ShoppingCart className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'shipping': return <Truck className="h-4 w-4" />;
      case 'promotion': return <Gift className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.search && !notification.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !notification.message.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type && notification.type !== filters.type) {
      return false;
    }
    if (filters.priority && notification.priority !== filters.priority) {
      return false;
    }
    if (filters.read !== undefined && notification.read !== filters.read) {
      return false;
    }
    return true;
  });

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Management</h1>
          <p className="text-muted-foreground">
            Manage system notifications, broadcasts, and communication templates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowBroadcastDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
          <Button variant="outline" onClick={() => setShowBulkSendDialog(true)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Send
          </Button>
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button onClick={fetchNotificationData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalSent || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.delivered || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.readRate ? `${(stats.readRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average read rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Latest system notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.message.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notifications found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common notification tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setShowBroadcastDialog(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Broadcast Notification
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setShowTemplateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setShowStatsDialog(true)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => notificationService.testPushNotification()}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Test Push Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search notifications..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as NotificationType }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-types">All Types</SelectItem>
                    <SelectItem value={NotificationTypes.GENERAL}>General</SelectItem>
                    <SelectItem value={NotificationTypes.ORDER}>Order</SelectItem>
                    <SelectItem value={NotificationTypes.PAYMENT}>Payment</SelectItem>
                    <SelectItem value={NotificationTypes.SHIPPING}>Shipping</SelectItem>
                    <SelectItem value={NotificationTypes.PROMOTION}>Promotion</SelectItem>
                    <SelectItem value={NotificationTypes.SYSTEM}>System</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.priority || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value as NotificationPriority }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-priorities">All Priorities</SelectItem>
                    <SelectItem value={NotificationPriorities.HIGH}>High</SelectItem>
                    <SelectItem value={NotificationPriorities.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={NotificationPriorities.LOW}>Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>System and user notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getNotificationIcon(notification.type)}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>To: {notification.userId || 'All Users'}</span>
                          <span>{formatDate(notification.createdAt)}</span>
                          {notification.actionUrl && (
                            <span>Has Action</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      <Badge variant="outline">
                        {notification.type}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredNotifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Manage reusable notification templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium">{template.name}</p>
                        <Badge className={template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {template.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {template.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Variables: {template.variables?.join(', ') || 'None'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditTemplateDialog(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No templates found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Statistics</CardTitle>
                <CardDescription>Notification delivery performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Sent</span>
                    <span className="font-medium">{stats?.totalSent || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Delivered</span>
                    <span className="font-medium text-green-600">{stats?.delivered || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failed</span>
                    <span className="font-medium text-red-600">{stats?.failed || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Read</span>
                    <span className="font-medium">{stats?.read || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Read Rate</span>
                    <span className="font-medium">
                      {stats?.readRate ? `${(stats.readRate * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Performance by notification channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">In-App</span>
                    </div>
                    <span className="font-medium">95%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Push</span>
                    </div>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <span className="font-medium">92%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broadcast Notification</DialogTitle>
            <DialogDescription>
              Send a notification to multiple users
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={broadcastForm.type}
                  onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, type: value as NotificationType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationTypes.GENERAL}>General</SelectItem>
                    <SelectItem value={NotificationTypes.PROMOTION}>Promotion</SelectItem>
                    <SelectItem value={NotificationTypes.SYSTEM}>System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Notification message"
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={broadcastForm.priority}
                  onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, priority: value as NotificationPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationPriorities.LOW}>Low</SelectItem>
                    <SelectItem value={NotificationPriorities.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={NotificationPriorities.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={broadcastForm.targetAudience}
                  onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, targetAudience: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                <Input
                  id="actionUrl"
                  placeholder="https://..."
                  value={broadcastForm.actionUrl || ''}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionText">Action Text (Optional)</Label>
                <Input
                  id="actionText"
                  placeholder="View Details"
                  value={broadcastForm.actionText || ''}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, actionText: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={broadcastForm.scheduledFor || ''}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBroadcast} disabled={sending}>
                {sending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Broadcast
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a reusable notification template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  placeholder="Template name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Type</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value as NotificationType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationTypes.ORDER}>Order</SelectItem>
                    <SelectItem value={NotificationTypes.PAYMENT}>Payment</SelectItem>
                    <SelectItem value={NotificationTypes.SHIPPING}>Shipping</SelectItem>
                    <SelectItem value={NotificationTypes.PROMOTION}>Promotion</SelectItem>
                    <SelectItem value={NotificationTypes.SYSTEM}>System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject *</Label>
              <Input
                id="template-subject"
                placeholder="Template subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-content">Content *</Label>
              <Textarea
                id="template-content"
                placeholder="Template content with variables like {{userName}}, {{orderNumber}}"
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-variables">Variables (comma-separated)</Label>
              <Input
                id="template-variables"
                placeholder="userName, orderNumber, amount"
                value={templateForm.variables.join(', ')}
                onChange={(e) => setTemplateForm(prev => ({ 
                  ...prev, 
                  variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
                }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="template-active"
                checked={templateForm.active}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="template-active">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details and content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Same form fields as create template */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-template-name">Template Name *</Label>
                <Input
                  id="edit-template-name"
                  placeholder="Template name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-template-type">Type</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value as NotificationType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationTypes.GENERAL}>General</SelectItem>
                    <SelectItem value={NotificationTypes.ORDER}>Order</SelectItem>
                    <SelectItem value={NotificationTypes.PAYMENT}>Payment</SelectItem>
                    <SelectItem value={NotificationTypes.SHIPPING}>Shipping</SelectItem>
                    <SelectItem value={NotificationTypes.PROMOTION}>Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-template-subject">Subject *</Label>
              <Input
                id="edit-template-subject"
                placeholder="Template subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-template-content">Content *</Label>
              <Textarea
                id="edit-template-content"
                placeholder="Template content with variables like {{userName}}, {{orderNumber}}"
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-template-variables">Variables (comma-separated)</Label>
              <Input
                id="edit-template-variables"
                placeholder="userName, orderNumber, amount"
                value={templateForm.variables.join(', ')}
                onChange={(e) => setTemplateForm(prev => ({ 
                  ...prev, 
                  variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
                }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-template-active"
                checked={templateForm.active}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="edit-template-active">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTemplate}>
                Update Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Send Dialog */}
      <Dialog open={showBulkSendDialog} onOpenChange={setShowBulkSendDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Send Notifications</DialogTitle>
            <DialogDescription>
              Send notifications to multiple users based on filters or specific user IDs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="bulk-template">Use Template (Optional)</Label>
              <Select
                value={bulkSendForm.templateId || ''}
                onValueChange={(value) => {
                  setBulkSendForm(prev => ({ ...prev, templateId: value || undefined }));
                  if (value) {
                    const template = templates.find(t => t.id === value);
                    if (template) {
                      setBulkSendForm(prev => ({
                        ...prev,
                        title: template.subject,
                        message: template.content,
                        type: template.type,
                        channels: template.channels
                      }));
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message Content */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-title">Title *</Label>
                <Input
                  id="bulk-title"
                  placeholder="Notification title"
                  value={bulkSendForm.title}
                  onChange={(e) => setBulkSendForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-type">Type</Label>
                <Select
                  value={bulkSendForm.type}
                  onValueChange={(value) => setBulkSendForm(prev => ({ ...prev, type: value as NotificationType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationTypes.GENERAL}>General</SelectItem>
                    <SelectItem value={NotificationTypes.ORDER}>Order</SelectItem>
                    <SelectItem value={NotificationTypes.PAYMENT}>Payment</SelectItem>
                    <SelectItem value={NotificationTypes.SHIPPING}>Shipping</SelectItem>
                    <SelectItem value={NotificationTypes.PROMOTION}>Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk-message">Message *</Label>
              <Textarea
                id="bulk-message"
                placeholder="Notification message"
                value={bulkSendForm.message}
                onChange={(e) => setBulkSendForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Target Audience */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-user-type">Target Audience</Label>
                <Select
                  value={bulkSendForm.userType}
                  onValueChange={(value) => setBulkSendForm(prev => ({ ...prev, userType: value as 'customers' | 'admins' | 'all' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-priority">Priority</Label>
                <Select
                  value={bulkSendForm.priority}
                  onValueChange={(value) => setBulkSendForm(prev => ({ ...prev, priority: value as NotificationPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationPriorities.LOW}>Low</SelectItem>
                    <SelectItem value={NotificationPriorities.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={NotificationPriorities.HIGH}>High</SelectItem>
                    <SelectItem value={NotificationPriorities.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="space-y-2">
              <Label htmlFor="bulk-user-ids">Specific User IDs (Optional)</Label>
              <Input
                id="bulk-user-ids"
                placeholder="user1, user2, user3 (comma-separated)"
                value={bulkSendForm.userIds}
                onChange={(e) => setBulkSendForm(prev => ({ ...prev, userIds: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use audience filter, or specify user IDs to target specific users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-tags">User Tags (Optional)</Label>
              <Input
                id="bulk-tags"
                placeholder="premium, new-customer, vip (comma-separated)"
                value={bulkSendForm.tags}
                onChange={(e) => setBulkSendForm(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <Label>Notification Channels</Label>
              <div className="flex flex-wrap gap-2">
                {['in_app', 'email', 'sms', 'push'].map((channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`bulk-channel-${channel}`}
                      checked={bulkSendForm.channels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkSendForm(prev => ({
                            ...prev,
                            channels: [...prev.channels, channel]
                          }));
                        } else {
                          setBulkSendForm(prev => ({
                            ...prev,
                            channels: prev.channels.filter(c => c !== channel)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`bulk-channel-${channel}`} className="capitalize">
                      {channel.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label htmlFor="bulk-schedule">Schedule For (Optional)</Label>
              <Input
                id="bulk-schedule"
                type="datetime-local"
                value={bulkSendForm.scheduledFor || ''}
                onChange={(e) => setBulkSendForm(prev => ({ ...prev, scheduledFor: e.target.value || undefined }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to send immediately
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkSendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkSend} disabled={bulkSending}>
                {bulkSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Send Bulk Notifications
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationManagement;