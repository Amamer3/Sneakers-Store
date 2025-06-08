import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cartService } from '@/services/cart-service';
import { productService } from '@/services/product-service';
import { useAuth } from './AuthContext';

// API response types
interface CartItemAPI {
  id: string;
  productId: string;
  quantity: number;
  size: string | null;
}

interface CartResponse {
  items: CartItemAPI[];
}

// Local CartItem type with UI-specific fields
interface CartItem extends CartItemAPI {
  price: number;
  name: string;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  totalPrice: number;
  totalItems: number;
  updateQuantity: (productId: string, size: string | null, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, size: string | null) => Promise<void>;
  addToCart: (productId: string, quantity: number, size: string | null) => Promise<void>;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const transformCartItems = async (cartItems: CartItemAPI[]): Promise<CartItem[]> => {
    return Promise.all(
      cartItems.map(async (item) => {
        const product = await productService.getProduct(item.productId);
        return {
          ...item,
          price: product.price,
          name: product.name,
          image: product.images[0]?.url ?? '/placeholder.svg',
        };
      })
    );
  };

  const loadCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartService.getCart();
      const cartItems = await transformCartItems(response.items);
      setItems(cartItems);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your cart items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity: number, size: string | null) => {
    try {
      setIsLoading(true);
      await cartService.addToCart(productId, quantity, size);
      // Reload cart to get updated items
      await loadCart();
      toast({
        title: 'Item Added',
        description: 'Successfully added item to cart',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to cart',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, size: string | null, quantity: number) => {
    try {
      setIsLoading(true);
      if (quantity < 1) {
        await removeFromCart(productId, size);
        return;
      }

      const cart = await cartService.updateCartItem(productId, { quantity, size });
      const transformedItems = await transformCartItems(cart.items);
      setItems(transformedItems);
      toast({
        title: 'Cart updated',
        description: 'Quantity has been updated',
      });
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string, size: string | null) => {
    try {
      setIsLoading(true);
      const cart = await cartService.removeFromCart(productId);
      const transformedItems = await transformCartItems(cart.items);
      setItems(transformedItems);
      toast({
        title: 'Item removed',
        description: 'Item has been removed from your cart',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculate totals
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPrice = total;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        totalPrice,
        totalItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
