import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';


const Cart = () => {
  const { items, removeFromCart, updateQuantity, total: totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  React.useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
      delay: 100,
    });
  }, []);

  const handleQuantityUpdate = async (itemId: string, size: string, newQuantity: number) => {
    try {
      const key = `${itemId}-${size}`;
      setLoadingItems(prev => new Set(prev).add(key));
      await updateQuantity(itemId, size, newQuantity);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quantity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(`${itemId}-${size}`);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string, size: string) => {
    try {
      const key = `${itemId}-${size}`;
      setLoadingItems(prev => new Set(prev).add(key));
      await removeFromCart(itemId, size);
      toast({
        title: 'Item Removed',
        description: 'The item has been removed from your cart.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(`${itemId}-${size}`);
        return next;
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-aos="fade-up">
          <div className="text-center bg-white rounded-2xl shadow-lg p-10">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">Start shopping to add items to your cart.</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full text-base font-semibold transition-all duration-300">
              <Link to="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12" data-aos="fade-up">
          <h1 className="text-4xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-lg text-gray-600 mt-3">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, index) => (
              <Card
                key={`${item.id}-${item.size}`}
                className="border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={String(index * 100)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    <Link to={`/product/${item.productId}`} className="group">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    
                    <div className="flex-1 space-y-2">
                      <Link to={`/product/${item.id}`} className="hover:text-indigo-600 transition-colors duration-300">
                        <h3 className="font-semibold text-xl text-gray-900">{item.name}</h3>
                      </Link>
                      <p className="text-gray-600 text-sm">Size: {item.size}</p>
                      <p className="text-lg font-semibold text-gray-900">{formatPrice(item.price)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-200 rounded-full">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityUpdate(item.id, item.size, item.quantity - 1)}
                          disabled={loadingItems.has(`${item.id}-${item.size}`) || item.quantity <= 1}
                          className="rounded-full hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </Button>
                        <span className="w-12 text-center font-medium text-gray-900">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityUpdate(item.id, item.size, item.quantity + 1)}
                          disabled={loadingItems.has(`${item.id}-${item.size}`)}
                          className="rounded-full hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id, item.size)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                        disabled={loadingItems.has(`${item.id}-${item.size}`)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1" data-aos="fade-up" data-aos-delay="200">
            <Card className="sticky top-24 border-gray-200 rounded-2xl shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>                  <div className="space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                    <span className="font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
                  </div>
                  
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span className="font-semibold text-gray-900">{formatPrice(totalPrice * 0.08)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-xl">{formatPrice(totalPrice * 1.08)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  asChild
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-3 text-base font-semibold transition-all duration-300"
                >
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
                
                <Button
                  variant="outline"
                  asChild
                  className="w-full mt-3 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-full py-3 text-base font-semibold transition-all duration-300"
                >
                  <Link to="/">Continue Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;