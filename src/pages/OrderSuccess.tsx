import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { paymentService } from '@/services/payment-service';
import { orderService } from '@/services/order-service';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const { formatPrice } = useCurrency();

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (reference) {
          // Card payment verification
          const verification = await paymentService.verifyPayment(reference);
          if (verification.status === 'success') {
            const orderDetails = await orderService.getOrderById(verification.orderId);
            setOrder(orderDetails);
          } else {
            setError('Payment verification failed. Please contact support if your payment was deducted.');
          }
        } else if (orderId) {
          // Cash on delivery order
          const orderDetails = await orderService.getOrderById(orderId);
          setOrder(orderDetails);
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setError(error.message || 'Failed to verify payment. Please contact support.');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [reference, orderId]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Verifying Payment</h2>
              <p className="text-gray-600 text-center">
                Please wait while we verify your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Payment Verification Failed</h2>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex space-x-4">
                <Link to="/orders">
                  <Button variant="outline">View Orders</Button>
                </Link>
                <Link to="/">
                  <Button>Continue Shopping</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-6">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
            <p className="text-gray-600 text-center">
              Thank you for your order. We'll send you updates about your order status via email.
            </p>
            
            {order && (
              <div className="w-full space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900">Order Details</h3>
                  <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                  <p className="text-sm text-gray-600">Total Amount: {formatPrice(order.total)}</p>
                  <p className="text-sm text-gray-600">
                    Payment Method: {order.paymentMethod === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900">Shipping Information</h3>
                  <p className="text-sm text-gray-600">{order.shipping.name}</p>
                  <p className="text-sm text-gray-600">{order.shipping.address.street}</p>
                  <p className="text-sm text-gray-600">
                    {order.shipping.address.city}, {order.shipping.address.state} {order.shipping.address.postalCode}
                  </p>
                  <p className="text-sm text-gray-600">{order.shipping.address.country}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Link to="/orders">
                <Button variant="outline">View Orders</Button>
              </Link>
              <Link to="/">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
