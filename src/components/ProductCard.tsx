import React, { useState, useCallback, Component, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// TypeScript interfaces
interface Image {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  images: Image[];
  sizes?: string[];
  inStock: boolean;
  featured: boolean;
}

interface ProductCardProps {
  product: Product;
  formatPrice: (amount: number) => string;
  isDeleting?: string;
  handleEdit?: (product: Product) => Promise<void>;
  handleDeleteProduct?: (productId: string) => Promise<void>;
  handleToggleFeatured?: (productId: string, featured: boolean) => Promise<void>;
  handleToggleStock?: (productId: string, inStock: boolean) => Promise<void>;
  isCompact?: boolean;
  showAdminActions?: boolean;
  className?: string;
}

// Custom debounce hook
const useDebounce = <T extends (...args: any[]) => void>(callback: T, delay: number) => {
  return React.useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(...args), delay);
    };
  }, [callback, delay]);
};

// Error Boundary component
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Fallback image (base64 SVG)
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="#6b7280">No Image</text></svg>';

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, formatPrice }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);

  const debouncedAddToCart = useDebounce(async (productId: string, quantity: number, size: string | null) => {
    try {
      await addToCart(productId, quantity, size);
      if (window?.analytics) {
        window.analytics.track('Product Added to Cart', {
          productId,
          productName: product.name,
          price: product.price,
        });
      }
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
        className: 'aria-live-region',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
        className: 'aria-live-region',
      });
    }
  }, 300);

  const debouncedWishlist = useDebounce(async (productId: string, isInList: boolean) => {
    try {
      if (isInList) {
        await removeFromWishlist(productId);
        if (window?.analytics) {
          window.analytics.track('Product Removed from Wishlist', {
            productId,
            productName: product.name,
          });
        }
        toast({
          title: 'Removed from wishlist',
          description: `${product.name} has been removed from your wishlist.`,
          className: 'aria-live-region',
        });
      } else {
        await addToWishlist(productId);
        if (window?.analytics) {
          window.analytics.track('Product Added to Wishlist', {
            productId,
            productName: product.name,
          });
        }
        toast({
          title: 'Added to wishlist',
          description: `${product.name} has been added to your wishlist.`,
          className: 'aria-live-region',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
        variant: 'destructive',
        className: 'aria-live-region',
      });
    }
  }, 300);

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to add items to your cart',
          action: (
            <Button onClick={() => navigate('/login')} size="sm" variant="outline">
              Login
            </Button>
          ),
          className: 'aria-live-region',
        });
        return;
      }

      if (!product.inStock) {
        toast({
          title: 'Out of Stock',
          description: 'This product is currently out of stock.',
          variant: 'destructive',
          className: 'aria-live-region',
        });
        return;
      }

      setIsAddingToCart(true);
      try {
        if (product.sizes?.length) {
          navigate(`/product/${product.id}`);
          toast({
            title: 'Select Size',
            description: 'Please choose a size on the product details page.',
            className: 'aria-live-region',
          });
        } else {
          await debouncedAddToCart(product.id, 1, null);
        }
      } finally {
        setIsAddingToCart(false);
      }
    },
    [isAuthenticated, product, navigate, toast, debouncedAddToCart]
  );

  const handleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to manage your wishlist',
          action: (
            <Button onClick={() => navigate('/login')} size="sm" variant="outline">
              Login
            </Button>
          ),
          className: 'aria-live-region',
        });
        return;
      }

      setIsUpdatingWishlist(true);
      try {
        await debouncedWishlist(product.id, isInWishlist(product.id));
      } finally {
        setIsUpdatingWishlist(false);
      }
    },
    [isAuthenticated, product.id, isInWishlist, debouncedWishlist, navigate, toast]
  );

  return (
    <ErrorBoundary fallback={<div className="text-red-500 p-5">Error rendering product card</div>}>
      <div className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="relative">
          <Link
            to={`/product/${product.id}`}
            className="block aspect-square rounded-xl bg-gray-100 overflow-hidden"
            aria-label={`View details for ${product.name}`}
          >
            <img
              src={product.images[0]?.url || FALLBACK_IMAGE}
              alt={product.name || 'Product image'}
              loading="lazy"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={e => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </Link>
          {!product.inStock && (
            <Badge variant="destructive" className="absolute top-3 right-3 text-sm font-semibold px-3 py-1 rounded-full shadow-md">
              Out of Stock
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-3 left-3 bg-indigo-600 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
              Featured
            </Badge>
          )}
          <div className="absolute bottom-3 right-3 space-y-2 flex flex-col items-end">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
              onClick={handleWishlist}
              disabled={isUpdatingWishlist}
              aria-label={isInWishlist(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              aria-busy={isUpdatingWishlist}
            >
              {isUpdatingWishlist ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : (
                <Heart
                  className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                />
              )}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
              onClick={handleAddToCart}
              disabled={isAddingToCart || !product.inStock}
              aria-label={`Add ${product.name} to cart`}
              aria-busy={isAddingToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : (
                <ShoppingCart className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 truncate">
              {product.name || 'Unnamed Product'}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 font-medium truncate">{product.brand || 'Unknown Brand'}</p>
          <p className="font-semibold text-xl text-gray-900">{formatPrice(product.price)}</p>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg animate-pulse">
      <Skeleton className="aspect-square bg-gray-200 rounded-xl mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-5 bg-gray-200 rounded-full w-3/4" />
        <Skeleton className="h-4 bg-gray-200 rounded-full w-1/2" />
        <Skeleton className="h-6 bg-gray-200 rounded-full w-1/4" />
      </div>
    </div>
  );
};

export default ProductCard;