import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Order } from '@/types/order';
import { orderService } from '@/services/order-service';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/context/CurrencyContext';

// Utility function for dates
const formatDate = (dateString: string | Date) => {
  if (!dateString) return 'Date not available';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const OrderStatusBadgeVariant: Record<Order['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'pending': 'secondary',
  'confirmed': 'default',
  'processing': 'secondary',
  'shipped': 'default',
  'delivered': 'default',
  'cancelled': 'destructive',
  'refunded': 'outline',
  'failed': 'destructive'
} as const;

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { formatPrice, currency } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err: any) {
        const message = err.friendlyMessage || 'Failed to load order details';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-10 w-1/3 mb-6 rounded-md" />
          <Card className="rounded-lg shadow-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-48 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="rounded-lg shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {error || 'Order not found'}
              </h2>
              <p className="text-gray-600">
                Please try again later or contact support if the problem persists.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-base text-gray-600 mt-2">
            Order #{order.id}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Package className="w-6 h-6 text-gray-600" />
                  Order Status
                </CardTitle>
                <Badge
                  variant={OrderStatusBadgeVariant[order.status]}
                  className="text-sm font-medium"
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Items */}
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-start space-x-4 py-4 border-b last:border-0"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>Quantity: {item.quantity}</p>
                        <p className="mt-1">Price: {formatPrice(item.price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-base font-medium text-gray-900">
                    <span>Total ({currency})</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                  {currency === 'GHS' && (
                    <p className="text-sm text-gray-500 text-right">
                      *Price converted from USD
                    </p>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div className="border-t pt-4">
                <div className="space-y-4">                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Information */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Order Information</h3>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>Ordered on: {formatDate(order.createdAt)}</p>
                        <p>Last updated: {formatDate(order.updatedAt)}</p>
                        <p>Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                        {order.paymentReference && (
                          <p>Payment Reference: {order.paymentReference}</p>
                        )}
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Customer Details</h3>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>Name: {order.shipping?.name || order.user?.name || 'Not provided'}</p>
                        <p>Email: {order.shipping?.email || order.user?.email || 'Not provided'}</p>
                        <p>Phone: {order.shipping?.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-700">Shipping Address</h3>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>{order.shippingAddress.street}</p>
                        <p>
                          {order.shippingAddress.city}
                          {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                          {order.shippingAddress.zipCode && ` ${order.shippingAddress.zipCode}`}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
