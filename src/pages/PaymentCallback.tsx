import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/payment-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentCallback() {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {    const verifyPayment = async () => {
      try {
        const { reference, orderId } = paymentService.getStoredPaymentData();
        if (!reference) {
          throw new Error('No payment reference found');
        }

        const response = await paymentService.verifyPayment(reference);
        
        if (response.status === 'success') {
          toast({
            title: 'Payment Successful',
            description: 'Your order has been confirmed.',
            variant: 'default',
          });
          
          // Navigate to order details or profile with the order highlighted
          if (orderId) {
            navigate(`/orders/${orderId}`);
          } else {
            navigate(`/profile?orderId=${response.orderId}`);
          }
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setError(error.message || 'Payment verification failed. Please contact support.');
        toast({
          title: 'Payment Verification Failed',
          description: error.message || 'Please try again or contact support.',
          variant: 'destructive',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [navigate, toast]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Verifying payment...</h2>
          <p className="mt-2 text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => navigate('/checkout')}
                className="w-full"
              >
                Return to Checkout
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return null;
}
