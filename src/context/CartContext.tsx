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

interface GuestCartResponse {
  success: boolean;
  item: CartItemAPI;
  message: string;
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
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
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
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        const response = await cartService.getCart();
        const cartItems = await transformCartItems(response.items);
        setItems(cartItems);
        // Save to localStorage as backup
        localStorage.setItem('cart', JSON.stringify(cartItems));
      } else {
        // Load from localStorage for non-authenticated users
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      }
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

  // Load cart when authenticated or on initial mount for non-authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      // Load from localStorage for non-authenticated users
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error parsing saved cart:', error);
          localStorage.removeItem('cart');
        }
      }
    }
  }, [isAuthenticated]);

  // Load cart from localStorage on initial mount for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error parsing saved cart:', error);
          localStorage.removeItem('cart');
        }
      }
    }
  }, []);

  const addToCart = async (productId: string, quantity: number, size: string | null) => {
    try {
      setIsLoading(true);
      console.log('AddToCart called with:', { productId, quantity, size, isAuthenticated });
      console.log('Current token:', localStorage.getItem('token'));
      
      if (isAuthenticated) {
        console.log('Adding to cart for authenticated user');
        try {
          const response = await cartService.addToCart(productId, quantity, size) as CartResponse | GuestCartResponse;
          console.log('Cart service response:', response);
          
          // Handle different response formats from backend
          if (response && 'items' in response && response.items) {
            // Standard cart response with items array
            console.log('Transforming cart items:', response.items);
            const transformedItems = await transformCartItems(response.items);
            console.log('Transformed items:', transformedItems);
            setItems(transformedItems);
            localStorage.setItem('cart', JSON.stringify(transformedItems));
          } else if (response && 'item' in response && response.success && response.item) {
            // Backend returned guest cart format - add item to existing cart
            console.log('Backend returned guest cart format, adding item manually');
            const product = await productService.getProduct(productId);
            const newItem: CartItem = {
              id: response.item.id || `${productId}-${size}-${Date.now()}`,
              productId,
              quantity,
              size,
              price: product.price,
              name: product.name,
              image: product.images[0]?.url ?? '/placeholder.svg'
            };
            const updatedItems = [...items, newItem];
             console.log('Updated cart items:', updatedItems);
             setItems(updatedItems);
             localStorage.setItem('cart', JSON.stringify(updatedItems));
             console.log('Cart items after state update (should show new items):', updatedItems);
          } else {
            console.log('No items in response, loading cart manually');
            await loadCart();
          }
        } catch (apiError: any) {
          console.error('API Error details:', {
            message: apiError.message,
            status: apiError.response?.status,
            data: apiError.response?.data,
            config: apiError.config
          });
          
          // Check if it's an authentication error
          if (apiError.response?.status === 401 || apiError.response?.status === 403) {
            console.log('Authentication error, treating as non-authenticated user');
            // Fall back to localStorage behavior for auth errors
            const product = await productService.getProduct(productId);
            const newItem: CartItem = {
              id: `${productId}-${size}-${Date.now()}`,
              productId,
              quantity,
              size,
              price: product.price,
              name: product.name,
              image: product.images[0]?.url ?? '/placeholder.svg'
            };
            const updatedItems = [...items, newItem];
            setItems(updatedItems);
            localStorage.setItem('cart', JSON.stringify(updatedItems));
          } else {
            // For other errors, re-throw
            throw apiError;
          }
        }
      } else {
        console.log('Adding to cart for non-authenticated user');
        const product = await productService.getProduct(productId);
        const newItem: CartItem = {
          id: `${productId}-${size}-${Date.now()}`,
          productId,
          quantity,
          size,
          price: product.price,
          name: product.name,
          image: product.images[0]?.url ?? '/placeholder.svg'
        };
        const updatedItems = [...items, newItem];
        console.log('Updated cart items for non-auth user:', updatedItems);
        setItems(updatedItems);
        localStorage.setItem('cart', JSON.stringify(updatedItems));
        console.log('Cart items after state update (non-auth):', updatedItems);
      }
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

      if (isAuthenticated) {
        const cart = await cartService.updateCartItem(productId, { quantity, size });
        const transformedItems = await transformCartItems(cart.items);
        setItems(transformedItems);
        localStorage.setItem('cart', JSON.stringify(transformedItems));
      } else {
        const updatedItems = items.map(item =>
          item.productId === productId && item.size === size
            ? { ...item, quantity }
            : item
        );
        setItems(updatedItems);
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
      
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
      if (isAuthenticated) {
        const cart = await cartService.removeFromCart(productId);
        const transformedItems = await transformCartItems(cart.items);
        setItems(transformedItems);
        localStorage.setItem('cart', JSON.stringify(transformedItems));
      } else {
        const updatedItems = items.filter(
          item => !(item.productId === productId && item.size === size)
        );
        setItems(updatedItems);
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
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

  const clearCart = async () => {
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        await cartService.clearCart();
      }
      setItems([]);
      localStorage.removeItem('cart');
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart',
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncCart = async () => {
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        const localCart = localStorage.getItem('cart');
        if (localCart) {
          const cartItems = JSON.parse(localCart);
          const syncData = cartItems.map((item: CartItem) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || undefined,
          }));
          const response = await cartService.syncCart(syncData);
          const transformedItems = await transformCartItems(response.items);
          setItems(transformedItems);
          localStorage.setItem('cart', JSON.stringify(transformedItems));
          toast({
            title: 'Cart synced',
            description: 'Your cart has been synchronized',
          });
        }
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
        syncCart,
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
