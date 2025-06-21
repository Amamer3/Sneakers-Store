import apiClient from '@/lib/api-client';

interface CartItem {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  size: string;
  price: number;
  createdAt: string;
}

interface Cart {
  success: Cart;
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: string;
}

interface AddToCartData {
  productId: string;
  quantity: number;
  size: string;
}

interface UpdateCartItemData {
  quantity?: number;
  size?: string;
}

interface CheckoutResponse {
  orderId: string;
  status: string;
  message: string;
}

export const cartService = {
  // Get user's cart
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get('/cart');
    return response.data;
  },
  // Add item to cart
  addToCart: async (productId: string, quantity: number, size: string | null): Promise<Cart> => {
    const response = await apiClient.post('/cart', {
      productId,
      quantity,
      size: size || undefined,
    });
    return response.data;
  },

  // Update cart item
  updateCartItem: async (itemId: string, data: UpdateCartItemData): Promise<Cart> => {
    const response = await apiClient.put(`/cart/${itemId}`, data);
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<Cart> => {
    const response = await apiClient.delete(`/cart/${itemId}`);
    return response.data;
  },

  // Clear entire cart
  clearCart: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete('/cart');
    return response.data;
  },

  // Sync cart (authenticated)
  syncCart: async (cartItems: AddToCartData[]): Promise<Cart> => {
    const response = await apiClient.post('/cart/sync', { items: cartItems });
    return response.data;
  },

  // Process checkout
  checkout: async (): Promise<CheckoutResponse> => {
    const response = await apiClient.post('/cart/checkout');
    return response.data;
  },
};
