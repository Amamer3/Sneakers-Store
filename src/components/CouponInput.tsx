import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { couponService } from '@/services/coupon-service';
import { useCurrency } from '@/context/CurrencyContext';

interface CouponInputProps {
  orderTotal: number;
  onCouponApplied: (discount: any) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: any;
  cartItems?: any[];
}

const CouponInput: React.FC<CouponInputProps> = ({
  orderTotal,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  cartItems = []
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await couponService.validateCoupon({
        couponCode: couponCode.trim(),
        orderTotal
      });

      if (result.isValid && result.discount) {
        onCouponApplied(result.discount);
        toast({
          title: 'Coupon Applied!',
          description: result.message || `You saved ${formatPrice(result.discount.amount)}`,
          variant: 'default',
        });
        setCouponCode('');
      } else {
        toast({
          title: 'Invalid Coupon',
          description: result.error || 'This coupon code is not valid',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply coupon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    toast({
      title: 'Coupon Removed',
      description: 'The coupon has been removed from your order',
      variant: 'default',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  return (
    <Card className="border-gray-200 rounded-xl">
      <CardContent className="p-4">
        {appliedCoupon ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Coupon Applied</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {appliedCoupon.code}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {appliedCoupon.type === 'percentage' 
                        ? `${appliedCoupon.value}% off` 
                        : `${formatPrice(appliedCoupon.value)} off`
                      }
                    </span>
                  </div>
                  {appliedCoupon.description && (
                    <p className="text-xs text-gray-500 mt-1">{appliedCoupon.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    -{formatPrice(appliedCoupon.amount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">Have a coupon code?</span>
            </div>
            
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="flex-1 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={isLoading || !couponCode.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Applying...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              Enter your coupon code to get a discount on your order
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CouponInput;