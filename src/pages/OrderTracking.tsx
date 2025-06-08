import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { orderService } from '@/services/order-service';
import type { Order } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { Package, Truck, CheckCircle, Clock, Search, MapPin, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const OrderTracking = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [trackingId, setTrackingId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await orderService.getUserOrders(page);
        setUserOrders(prev => page === 1 ? response.items : [...prev, ...response.items]);
        setHasMore(response.total > page * response.limit);
        setError('');
      } catch (error: any) {
        console.error('Failed to fetch orders:', error);
        setError('Failed to load orders. Please try again later.');
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.response?.data?.message || "Failed to load orders",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, page]);

  const handleTrackOrder = async () => {
    if (!trackingId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an order ID",
      });
      return;
    }

    try {
      const order = await orderService.getOrderById(trackingId);
      setSearchedOrder(order);
      setError('');
    } catch (error: any) {
      console.error('Failed to track order:', error);
      setSearchedOrder(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Order not found",
      });
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrackingSteps = (status: Order['status']) => {
    const steps = [
      { label: 'Order Placed', icon: CheckCircle, completed: true },
      { label: 'Processing', icon: Clock, completed: status !== 'pending' },
      { label: 'Shipped', icon: Truck, completed: status === 'shipped' || status === 'delivered' },
      { label: 'Delivered', icon: Package, completed: status === 'delivered' }
    ];
    return steps;
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const steps = getTrackingSteps(order.status);
    
    return (
      <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order #{order.id}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge variant="default" className={`text-sm ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tracking Progress */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4 text-lg">Tracking Progress</h3>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ 
                    width: `${(steps.filter(s => s.completed).length - 1) * 33.33}%` 
                  }}
                />
              </div>
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step.completed 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-500' 
                      : 'bg-white text-gray-400 border-gray-300'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    step.completed ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4 text-lg">Items in this order</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.productId || index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-gray-600">{formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center border-t pt-4">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Shipping Address</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-500 mt-1 mr-2" />
                <div>
                  <p className="text-gray-600">{order.shippingAddress.street}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Order Tracking Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Input
                type="text"
                placeholder="Enter your order ID"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTrackOrder} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <Search className="w-4 h-4 mr-2" />
                Track Order
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Searched Order */}
        {searchedOrder && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Order Details</h2>
            <OrderCard order={searchedOrder} />
          </div>
        )}

        {/* User's Orders */}
        {error ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-lg text-gray-600">{error}</p>
          </div>
        ) : (
          <>
            {user && userOrders.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Your Recent Orders</h2>
                {userOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={loadMore} 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {user && userOrders.length === 0 && !searchedOrder && (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg text-gray-600">You haven't placed any orders yet.</p>
              </div>
            )}

            {!user && !searchedOrder && (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">Please log in to view your orders or enter an order ID to track a specific order.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
