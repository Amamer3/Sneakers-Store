import React from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentMethodProps {
  onPaymentMethodChange: (method: 'cash' | 'card') => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodProps> = ({ onPaymentMethodChange }) => {
  const { currentZone, isLoading, error, allowsCashOnDelivery } = useDelivery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Method</h3>
      
      {!allowsCashOnDelivery && (
        <Alert>
          <Truck className="h-4 w-4" />
          <AlertTitle>Payment Required</AlertTitle>
          <AlertDescription>
            Cash on delivery is only available for standard delivery options. 
            For {currentZone?.name || 'your selected delivery method'}, payment is required before delivery.
          </AlertDescription>
        </Alert>
      )}

      <RadioGroup defaultValue="card" onValueChange={(value) => onPaymentMethodChange(value as 'cash' | 'card')}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="card" id="card" />
          <Label htmlFor="card">Pay with Card</Label>
        </div>
        
        {allowsCashOnDelivery && (
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash">Cash on Delivery</Label>
          </div>
        )}
      </RadioGroup>

      {currentZone && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Delivery Option: {currentZone.name}</p>
          <p>{currentZone.description}</p>
          <p>Estimated Delivery: {currentZone.estimatedDays} business day{currentZone.estimatedDays !== 1 ? 's' : ''}</p>
          <p>Delivery Fee: GH₵{currentZone.price.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};
