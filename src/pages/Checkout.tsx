import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useDelivery } from '@/context/DeliveryContext';
import { useCurrency } from '@/context/CurrencyContext';
import { orderService } from '@/services/order-service';
import { inventoryService } from '@/services/inventory-service';
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
import { Loader2, AlertTriangle, RefreshCcw, LogIn } from 'lucide-react';
import type { CreateOrderInput, Order } from '@/types/order';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutState {
  isProcessing: boolean;
  currentStep: 'validating' | 'validating-stock' | 'processing-payment' | 'creating-order' | 'completed';
  error: string | null;
  errorDetails?: {
    code?: string;
    details?: string;
    timestamp?: string;
  };
}

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { currentZone } = useDelivery();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication status and redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to proceed with checkout.',
        variant: 'destructive',
      });
      // Redirect to login with return URL
      navigate('/login?redirect=/checkout');
    }
  }, [isAuthenticated, isLoading, navigate, toast]);

  const buyNowItem = window.sessionStorage.getItem('buyNowItem') 
    ? JSON.parse(window.sessionStorage.getItem('buyNowItem')!) 
    : null;

  const allItems = buyNowItem ? [...items, buyNowItem] : items;
  const subtotal = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    isProcessing: false,
    currentStep: 'validating',
    error: null
  });

  const handleShippingChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateCartStock = async () => {
    try {
      const stockItems = allItems.map(item => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity
      }));
      
      const bulkStockCheck = await inventoryService.bulkCheckStock(stockItems);
      
      if (!bulkStockCheck.allAvailable) {
        const unavailableItems = bulkStockCheck.results
          .filter(result => !result.isAvailable)
          .map(result => {
            const item = allItems.find(i => i.productId === result.productId);
            return `${item?.name || 'Unknown item'} (Available: ${result.availableQuantity})`;
          });
        
        throw new Error(`The following items are no longer available: ${unavailableItems.join(', ')}`);
      }
    } catch (error: any) {
      throw new Error(`Stock validation failed: ${error.message}`);
    }
  };

  const createOrder = async () => {
    const calculatedTotal = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + tax + deliveryFee;
    if (!calculatedTotal || calculatedTotal <= 0) {
      throw new Error('Invalid order total');
    }

    if (!shippingInfo.phoneNumber?.trim()) {
      throw new Error('Phone number is required');
    }

    const orderInput: CreateOrderInput = {
      items: allItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        image: item.image
      })),
      shippingAddress: {
        street: shippingInfo.address.trim(),
        city: shippingInfo.city.trim(),
        state: shippingInfo.state.trim(),
        country: shippingInfo.country.trim(),
        postalCode: shippingInfo.zipCode || '',
        phone: shippingInfo.phoneNumber.trim()
      },
      total: calculatedTotal,
      status: paymentMethod === 'card' ? 'processing' : 'pending',
      deliveryFee,
      tax
    };

    const order = await orderService.createOrder(orderInput);
    if (!order?.id) {
      throw new Error('Failed to create order: No order ID received');
    }
    return order;
  };  const processPayment = async (order: Order): Promise<string | undefined> => {
    if (paymentMethod === 'cash') {
      return undefined;
    }

    // Verify Paystack 
    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      toast({
        title: 'Configuration Error',
        description: 'Payment system is not properly configured. Please contact support.',
        variant: 'destructive',
      });
      throw new Error('Paystack public key is not configured');
    }

    setCheckoutState(prev => ({ ...prev, currentStep: 'processing-payment' }));    try {
      // Show processing message first
      toast({
        title: 'Processing Payment',
        description: 'Opening payment popup...',
        duration: 3000,
      });      // Initialize payment
      const payment = await paymentService.initializePayment({
        amount: Number(total.toFixed(2)),
        email: shippingInfo.email,
        orderId: order.id,
        customerId: user?.id || '',
        metadata: {
          orderId: order.id,
          customerName: shippingInfo.fullName,
          currency: 'GHS',
          referrer: window.location.href
        }
      });

      // Payment was successful and verified
      setCheckoutState(prev => ({ ...prev, currentStep: 'completed' }));
      
      // Show success message
      toast({
        title: 'Payment Successful!',
        description: 'Your order has been confirmed.',
        variant: 'default',
        duration: 3000,
      });

      // Clear cart and redirect to order confirmation
      await clearCart();
      // Clear buyNowItem from sessionStorage if it exists
      window.sessionStorage.removeItem('buyNowItem');
      navigate(`/profile?orderId=${order.id}`);

      return payment.reference;
    } catch (error: any) {
      // Reset checkout state
      setCheckoutState(prev => ({ ...prev, currentStep: 'validating' }));      if (error.message === 'Payment cancelled by user') {
        toast({
          title: 'Payment Cancelled',
          description: 'You cancelled the payment. You can try again when ready.',
          variant: 'default',
        });
      } else {
        console.error('Payment error:', error);
        toast({
          title: 'Payment Failed',
          description: error.message || 'Failed to process payment. Please try again.',
          variant: 'destructive',
        });
      }
      throw error;
    }
  };

  const validateFields = () => {
    const requiredFields = {
      fullName: 'Full Name',
      email: 'Email',
      phoneNumber: 'Phone Number',
      address: 'Street Address',
      city: 'City',
      state: 'State',
      country: 'Country'
    };

    const missingFields = (Object.entries(requiredFields) as Array<[keyof typeof shippingInfo, string]>)
      .filter(([key]) => !shippingInfo[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      throw new Error(`Please fill in: ${missingFields.join(', ')}`);
    }

    if (!items.length && !window.sessionStorage.getItem('buyNowItem')) {
      throw new Error('Cart is empty. Please add items before checking out.');
    }

    if (!total || total <= 0 || isNaN(total)) {
      throw new Error('Invalid order total');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(null);
    setCheckoutState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      currentStep: 'validating',
      error: null 
    }));

    try {
      // Step 1: Validate all required fields and cart state
      validateFields();
      
      // Step 2: Validate stock availability
      setCheckoutState(prev => ({ ...prev, currentStep: 'validating-stock' }));
      await validateCartStock();
      
      // Step 3: Create order
      setCheckoutState(prev => ({ ...prev, currentStep: 'creating-order' }));
      const order = await createOrder();
      
      // Step 4: Process payment based on method
      if (paymentMethod === 'card') {
        await processPayment(order);
        // All success handling is done in processPayment
      } else {
        // Handle cash payment success
        setCheckoutState(prev => ({ ...prev, currentStep: 'completed' }));
        
        toast({
          title: 'Order Confirmed!',
          description: 'Taking you to your order details...',
          variant: 'default',
          duration: 3000,
        });
        
        // Clear cart and redirect for cash payments
        await clearCart();
        navigate(`/profile?orderId=${order.id}`);
      }
      } catch (error: any) {      console.error('Checkout error:', error);
      
      // Extract error details
      const errorDetails = {
        code: error.response?.status || 'UNKNOWN',
        details: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      };

      // Handle specific error types
      let errorTitle = 'Checkout Failed';
      let errorDescription = `Error: ${errorDetails.details}. Please try again or contact support if the problem persists.`;
      
      if (errorDetails.details.includes('Insufficient stock')) {
        errorTitle = 'Item Out of Stock';
        errorDescription = 'One or more items in your cart are no longer available. Please remove them and try again.';
        
        // Suggest refreshing cart to get updated stock info
        setTimeout(() => {
          toast({
            title: 'Tip',
            description: 'Refresh your cart to see updated availability.',
            variant: 'default'
          });
        }, 3000);
      } else if (errorDetails.details.includes('Invalid product')) {
        errorTitle = 'Invalid Product';
        errorDescription = 'One or more items in your cart are no longer valid. Please refresh your cart and try again.';
      }

      setCheckoutState(prev => ({ 
        ...prev, 
        error: 'Failed to process checkout. Please try again.',
        errorDetails
      }));

      // Show detailed error to user
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorDescription
      });
    } finally {
      setCheckoutState(prev => ({ ...prev, isProcessing: false }));
      setProcessing(false);
    }
  };

  // Helper function to convert Ghana Cedis (GHS) to pesewas (GHp)
  const convertCedisToMinorUnit = (cedis: number): number => {
    return Math.round(cedis * 100);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phoneNumber', 'address', 'city', 'state', 'country'];
    const missingFields = requiredFields.filter(field => !shippingInfo[field as keyof typeof shippingInfo]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: `Please fill in: ${missingFields.join(', ')}`
      });
      return;
    }

    setCheckoutState({
      isProcessing: true,
      currentStep: 'creating-order',
      error: null
    });

    try {
      // Create order first
      const order = await createOrder();

      // For card payments, initialize Paystack
      if (paymentMethod === 'card') {
        setCheckoutState({
          isProcessing: true,
          currentStep: 'processing-payment',
          error: null
        });

        const paymentInit = await paymentService.initializePayment({
          amount: convertCedisToMinorUnit(total),
          email: shippingInfo.email,
          orderId: order.id,
          customerId: user?.id || '',
          metadata: {
            orderId: order.id,
            customerName: shippingInfo.fullName,
            currency: 'GHS',
            amountInCedis: total.toFixed(2)
          }
        });        // Payment is handled by the Paystack popup
        // The cart will be cleared after successful payment in the callback
        // No need to redirect as popup handles the flow
      } else {
        // For cash payments, just clear cart and redirect
        await clearCart();
        navigate(`/orders/${order.id}`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutState({
        isProcessing: false,
        currentStep: 'validating',
        error: error.message || 'Failed to process checkout'
      });
      toast({
        variant: 'destructive',
        title: 'Checkout Failed',
        description: error.message || 'Failed to process your order. Please try again.'
      });
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert>
            <LogIn className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>You need to be logged in to proceed with checkout.</p>
              <Button onClick={() => navigate('/login?redirect=/checkout')} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Display network error if any
  if (networkError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          {networkError}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNetworkError(null)}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Update loading state display
  const getProcessingMessage = () => {
    switch (checkoutState.currentStep) {
      case 'validating':
        return 'Validating your information...';
      case 'processing-payment':
        return 'Processing payment...';
      case 'creating-order':
        return 'Creating your order...';
      case 'completed':
        return 'Order completed!';
      default:
        return 'Processing...';
    }
  };

  /**
   * Converts Ghana Cedis (GHS) to pesewas (GHp)
   * @param cedis Amount in Ghana Cedis
   * @returns Amount in pesewas (100 pesewas = 1 Ghana Cedi)
   */
  const convertToMinorUnit = (cedis: number): number => {
    return Math.round(cedis * 100);
  };

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
                      disabled={processing || !currentZone}
                    >                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {getProcessingMessage()}
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
}
