
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { mockOrders } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { Package, Truck, CheckCircle, Clock, Search, MapPin } from 'lucide-react';

const OrderTracking = () => {
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);
  
  const userOrders = user ? mockOrders.filter(order => order.userId === user.id) : [];

  const handleTrackOrder = () => {
    const order = mockOrders.find(o => o.id === trackingId);
    setSearchedOrder(order || null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrackingSteps = (status: string) => {
    const steps = [
      { label: 'Order Placed', icon: CheckCircle, completed: true },
      { label: 'Processing', icon: Clock, completed: status !== 'pending' },
      { label: 'Shipped', icon: Truck, completed: status === 'shipped' || status === 'delivered' },
      { label: 'Delivered', icon: Package, completed: status === 'delivered' }
    ];
    return steps;
  };

  const OrderCard = ({ order }: { order: any }) => {
    const steps = getTrackingSteps(order.status);
    
    return (
      <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">Order #{order.id}</CardTitle>
              <p className="text-gray-600 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Badge className={`${getStatusColor(order.status)} border px-3 py-1 font-semibold`}>
              {order.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Size: {item.size} | Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Delivery Information</h3>
            </div>
            <p className="text-blue-800">
              {order.status === 'delivered' 
                ? 'Delivered to your address' 
                : order.status === 'shipped'
                ? 'En route to your address'
                : 'Will be shipped to your registered address'
              }
            </p>
            {order.status === 'shipped' && (
              <p className="text-sm text-blue-600 mt-1">
                Estimated delivery: {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-xl text-blue-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600 mt-2">Track your orders and stay updated on delivery status</p>
        </div>

        {/* Track by Order ID */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Track Order by ID</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Input
                placeholder="Enter order ID (e.g., 1001)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTrackOrder} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Track Order
              </Button>
            </div>
            {searchedOrder === null && trackingId && (
              <p className="text-red-600 mt-2">Order not found. Please check your order ID.</p>
            )}
          </CardContent>
        </Card>

        {/* Search Result */}
        {searchedOrder && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Search Result</h2>
            <OrderCard order={searchedOrder} />
          </div>
        )}

        {/* User Orders */}
        {user && userOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Orders</h2>
            {userOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {user && userOrders.length === 0 && !searchedOrder && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <a href="/">Browse Products</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {!user && !searchedOrder && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Your Orders</h3>
              <p className="text-gray-600 mb-4">
                Use the search box above to track any order, or log in to see all your orders
              </p>
              <Button asChild variant="outline" className="mr-2">
                <a href="/login">Login</a>
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <a href="/register">Create Account</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
