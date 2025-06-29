import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { couponService } from '@/services/coupon-service';
import { useToast } from '@/hooks/use-toast';

const CouponTest: React.FC = () => {
  const [couponCode, setCouponCode] = useState('');
  const [orderTotal, setOrderTotal] = useState(100);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testValidation = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const validationResult = await couponService.validateCoupon({
        couponCode: couponCode.trim(),
        orderTotal
      });
      
      setResult(validationResult);
      
      if (validationResult.isValid) {
        toast({
          title: 'Valid Coupon!',
          description: `Discount: $${validationResult.discount?.amount || 0}`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Invalid Coupon',
          description: validationResult.error || 'Coupon is not valid',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate coupon',
        variant: 'destructive',
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAdminEndpoints = async () => {
    setLoading(true);
    try {
      // Test getting all coupons
      const coupons = await couponService.getAllCoupons();
      console.log('All coupons:', coupons);
      
      // Test getting stats
      const stats = await couponService.getCouponStats();
      console.log('Coupon stats:', stats);
      
      toast({
        title: 'Admin Endpoints Test',
        description: `Found ${coupons.length} coupons. Check console for details.`,
        variant: 'default',
      });
      
      setResult({ coupons, stats });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to test admin endpoints',
        variant: 'destructive',
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testCartEndpoints = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Test applying coupon to cart
      const applyResult = await couponService.applyCartCoupon({
        couponCode: couponCode.trim(),
        cartTotal: orderTotal
      });
      
      console.log('Apply cart coupon result:', applyResult);
      
      // Test removing coupon from cart
      const removeResult = await couponService.removeCartCoupon();
      console.log('Remove cart coupon result:', removeResult);
      
      toast({
        title: 'Cart Endpoints Test',
        description: 'Cart coupon operations completed. Check console for details.',
        variant: 'default',
      });
      
      setResult({ applyResult, removeResult });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to test cart endpoints',
        variant: 'destructive',
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Coupon API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Coupon Code</label>
            <Input
              type="text"
              placeholder="Enter coupon code (try: SAVE20, WELCOME10, FREESHIP)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Order Total ($)</label>
            <Input
              type="number"
              value={orderTotal}
              onChange={(e) => setOrderTotal(Number(e.target.value))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={testValidation} 
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Validation'}
            </Button>
            
            <Button 
              onClick={testAdminEndpoints} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Test Admin APIs'}
            </Button>
            
            <Button 
              onClick={testCartEndpoints} 
              disabled={loading}
              variant="secondary"
            >
              {loading ? 'Testing...' : 'Test Cart APIs'}
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponTest;