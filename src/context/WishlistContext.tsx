import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { wishlistService } from '@/services/wishlist-service';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  items: string[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await wishlistService.getWishlist();
      const productIds = response?.length ? response.map(item => item.productId) : [];
      setItems(productIds);
    } catch (error: any) {
      console.error('Error loading wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlist',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist, isAuthenticated]);

  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to add items to your wishlist',
        variant: 'default',
      });
      return;
    }

    try {
      await wishlistService.addToWishlist(productId);
      setItems(prev => [...prev, productId]);
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to wishlist',
        variant: 'destructive',
      });
      // Refresh the wishlist to ensure consistent state
      loadWishlist();
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to manage your wishlist',
        variant: 'default',
      });
      return;
    }

    try {
      await wishlistService.removeFromWishlist(productId);
      setItems(prev => prev.filter(id => id !== productId));
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist',
        variant: 'destructive',
      });
      // Refresh the wishlist to ensure consistent state
      loadWishlist();
    }
  };

  const isInWishlist = useCallback((productId: string) => {
    return items.includes(productId);
  }, [items]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
