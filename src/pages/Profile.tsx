import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import type { Order } from '@/types/order';
import { orderService } from '@/services/order-service';
import { profileService } from '@/services/profile-service';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Package, User, Heart, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import AOS from 'aos';
import 'aos/dist/aos.css';

const getOrderStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'processing':
      return 'secondary';
    case 'shipped':
    case 'delivered':
      return 'default';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function Profile() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  // Get orderId and reference from URL params
  const searchParams = new URLSearchParams(location.search);
  const highlightedOrderId = searchParams.get('orderId');
  const paymentReference = searchParams.get('reference');

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);
  // Fetch orders and highlight the recent one if specified
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);        const response = await orderService.getMyOrders();
        const ordersList = response.items || [];
        setOrders(ordersList);

        // If there's a highlighted order, scroll to it and show a toast
        if (highlightedOrderId) {
          const recentOrder = ordersList.find(order => order.id === highlightedOrderId);
          if (recentOrder) {
            setSelectedOrder(recentOrder);
            setActiveTab('orders');
            toast({
              title: 'Order Status',
              description: `Your order #${highlightedOrderId} has been ${recentOrder.status}`,
              variant: 'default',
            });

            // Scroll to the orders section
            const ordersSection = document.getElementById('orders-section');
            if (ordersSection) {
              ordersSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your orders. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchOrders();
    }
  }, [highlightedOrderId, toast, user?.id]);

  const handleSaveProfile = async () => {
    if (!user || !editedName.trim()) return;

    try {
      setIsSaving(true);
      await profileService.updateProfile({ ...user, name: editedName.trim() });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default',
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const isHighlighted = order.id === highlightedOrderId;
    
    return (
      <Card 
        className={`mb-4 transition-all duration-300 ${
          isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''
        }`}
        data-aos={isHighlighted ? 'zoom-in' : 'fade-up'}
      >
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Order #{order.id}</span>            <Badge variant={getOrderStatusBadgeVariant(order.status)}>
              {order.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            {order.createdAt ? (
              <>Placed on {new Date(order.createdAt).toLocaleDateString()}</>
            ) : (
              'Date not available'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">Items:</p>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 mt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <CardContent className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
            <p className="mb-4">Please log in to view your profile</p>
            <Button asChild>
              <Link to="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders" id="orders-section">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {/* Profile Content */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving || !editedName.trim()}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(user.name);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-lg">{user.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setEditedName(user.name);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-lg mt-2">{user.email}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Card key={n}>
                    <CardHeader>
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
                  <p className="text-gray-500 mb-4">Start shopping to create your first order</p>
                  <Button asChild>
                    <Link to="/">Shop Now</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};