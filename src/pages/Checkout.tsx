import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useDelivery } from '@/context/DeliveryContext';
import { useCurrency } from '@/context/CurrencyContext';
import { orderService } from '@/services/order-service';
import { paymentService } from '@/services/payment-service';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { DeliveryInstructions } from '@/components/DeliveryInstructions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';

const Checkout = () => {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { validateAddress, currentZone } = useDelivery();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = currentZone?.price || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + tax + deliveryFee;

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Ghana'
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [processing, setProcessing] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    if (shippingInfo.city && shippingInfo.country) {
      validateShippingAddress();
    }
  }, [shippingInfo.city, shippingInfo.state, shippingInfo.country]);

  const handleShippingChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateShippingAddress = async () => {
    try {
      setValidatingAddress(true);
      setNetworkError(null);      const result = await validateAddress({
        street: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postalCode: shippingInfo.zipCode,
        country: shippingInfo.country
      });

      if (!result.isValid) {
        toast({
          title: "Invalid Delivery Address",
          description: result.message || "Please check your delivery address",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate address';
      setNetworkError(errorMessage);
      console.error('Address validation error:', error);
    } finally {
      setValidatingAddress(false);
    }
  };

  const handlePayment = async (orderId: string) => {
    try {
      setProcessing(true);
      if (paymentMethod === 'card') {
        // Initialize PayStack payment
        const payment = await paymentService.initializePayment(
          orderId,
          total,
          shippingInfo.email
        );

        if (payment.status === 'success') {
          // Verify the payment
          const verification = await paymentService.verifyPayment(payment.reference);
          
          if (verification.status === 'success') {
            // Payment successful
            clearCart();
            toast({
              title: 'Payment successful!',
              description: 'Your order has been confirmed.',
              variant: 'default',
            });
            navigate(`/order/${orderId}/success?reference=${payment.reference}`);
          } else {
            // Payment failed
            setNetworkError('Payment verification failed. Please try again.');
            await orderService.updateOrderStatus(orderId, { status: 'failed' });
          }
        }
      } else {
        // Cash on delivery
        await orderService.updateOrderStatus(orderId, { status: 'pending' });
        clearCart();
        navigate(`/order/${orderId}/success`);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setNetworkError(error.message || 'Payment failed. Please try again.');
      if (orderId) {
        await orderService.updateOrderStatus(orderId, { status: 'failed' });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(null);

    if (!items.length) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checking out.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      // Create the order first
      const order = await orderService.createOrder({
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        shippingAddress: {
          street: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: shippingInfo.country,
          postalCode: shippingInfo.zipCode,
          zipCode: ''
        }
      });

      // Process payment
      await handlePayment(order.id);
    } catch (error: any) {
      console.error('Checkout error:', error);
      setNetworkError(error.message || 'Failed to process order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Show network error alert
  if (networkError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Network Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{networkError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-4"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Shipping Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={shippingInfo.fullName}
                        onChange={(e) => handleShippingChange('fullName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => handleShippingChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="e.g., +233 XX XXX XXXX"
                        value={shippingInfo.phoneNumber}
                        onChange={(e) => handleShippingChange('phoneNumber', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => handleShippingChange('address', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingInfo.city}
                        onChange={(e) => handleShippingChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Region/State</Label>
                      <Input
                        id="state"
                        value={shippingInfo.state}
                        onChange={(e) => handleShippingChange('state', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={shippingInfo.country}
                        onChange={(e) => handleShippingChange('country', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethodSelector onPaymentMethodChange={setPaymentMethod} />
                </CardContent>
              </Card>

              {paymentMethod === 'cash' && currentZone && (
                <DeliveryInstructions
                  zone={currentZone}
                  paymentMethod={paymentMethod}
                  amount={total}
                />
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>{currentZone ? formatPrice(deliveryFee) : 'Calculating...'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-xl">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-4"
                      disabled={processing || validatingAddress || !currentZone}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : validatingAddress ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validating Address...
                        </>
                      ) : !currentZone ? (
                        'Please enter delivery address'
                      ) : (
                        `Place Order ${paymentMethod === 'card' ? '- Pay with Card' : '- Pay on Delivery'}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
