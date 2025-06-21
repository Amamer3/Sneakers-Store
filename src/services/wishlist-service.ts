import apiClient from '@/lib/api-client';

interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: string;
}

export const wishlistService = {
  // Get user's wishlist
  getWishlist: async (): Promise<WishlistItem[]> => {
    try {
      const response = await apiClient.get('/users/wishlist');
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      return [];
    }
  },

  // Add item to wishlist
  addToWishlist: async (productId: string): Promise<WishlistItem> => {
    try {
      console.log('Adding to wishlist:', productId);
      const response = await apiClient.post('/users/wishlist', { productId });
      console.log('Add to wishlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Remove item from wishlist
  removeFromWishlist: async (productId: string): Promise<void> => {
    try {
      console.log('Removing from wishlist:', productId);
      const response = await apiClient.delete(`/users/wishlist/${productId}`);
      console.log('Remove from wishlist response:', response.data);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Clear entire wishlist
  clearWishlist: async (): Promise<void> => {
    try {
      console.log('Clearing entire wishlist');
      const response = await apiClient.delete('/users/wishlist');
      console.log('Clear wishlist response:', response.data);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },
};
