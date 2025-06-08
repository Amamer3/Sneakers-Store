import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeliveryZone } from '@/services/delivery-service';
import { Clock, MapPin, Phone, AlertTriangle, Banknote, Info } from 'lucide-react';

interface DeliveryInstructionsProps {
  zone: DeliveryZone;
  paymentMethod: 'cash' | 'card';
  amount: number;
}

export const DeliveryInstructions: React.FC<DeliveryInstructionsProps> = ({
  zone,
  paymentMethod,
  amount,
}) => {
  if (paymentMethod !== 'cash') return null;

  return (
    <div className="space-y-4">
      <Card className="border-indigo-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-indigo-700">
            Cash on Delivery Instructions
          </CardTitle>
          <CardDescription>
            Please read these important instructions for your delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Delivery Zone</h4>
              <p className="text-sm text-gray-600">
                Your delivery will be made to {zone.name} within {zone.estimatedDays}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <Banknote className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Payment Details</h4>
              <p className="text-sm text-gray-600">
                Please prepare exact amount of {amount.toFixed(2)} GH₵
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• Our delivery personnel don't carry change</li>
                <li>• Mobile money payments can be arranged on delivery</li>
                <li>• Cash must be in good condition (no torn notes)</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Delivery Time</h4>
              <p className="text-sm text-gray-600">
                You'll receive a call 30 minutes before delivery
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• Delivery hours: 9:00 AM - 6:00 PM</li>
                <li>• Please be available to receive your package</li>
                <li>• Estimated delivery time: {zone.estimatedDays}</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <Phone className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Contact Information</h4>
              <p className="text-sm text-gray-600">
                Keep your phone nearby and available
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• You'll receive SMS updates about your delivery</li>
                <li>• Our delivery partner will call before arrival</li>
                <li>• Make sure to answer calls from unknown numbers</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Safety & Security</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• Only pay to uniformed delivery personnel with ID</li>
                <li>• Check your items before making payment</li>
                <li>• Keep your order reference number handy</li>
                <li>• Report suspicious behavior to our support line</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium">If You're Not Available</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• Notify us at least 2 hours before delivery</li>
                <li>• You can reschedule one time at no cost</li>
                <li>• Designate an authorized person to receive</li>
                <li>• Subsequent reschedules may incur a fee</li>
              </ul>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              If no one is available to receive and pay for the order after 3 delivery attempts,
              the order may be cancelled and you may be charged a restocking fee.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          If you're not available during delivery, your order may be returned and you'll need to reschedule.
          A rescheduling fee may apply.
        </AlertDescription>
      </Alert>

      {zone.id === 'accra-metro' && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Accra Metropolitan Area Only</AlertTitle>
          <AlertDescription className="text-amber-700">
            Cash on delivery is only available within Accra Metropolitan area. Please ensure your delivery address is within this zone.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
