import React, { useState, useCallback, Component, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  formatPrice,
  isDeleting,
  handleEdit,
  handleDeleteProduct,
  handleToggleFeatured,
  handleToggleStock,
  isCompact = false,
  showAdminActions = false,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, items } = useCart();
  const isInCart = (productId: string) => items.some(item => item.productId === productId);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  const toggleWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        toast({ description: 'Removed from wishlist' });
      } else {
        await addToWishlist(product.id);
        toast({ description: 'Added to wishlist' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist',
        variant: 'destructive',
      });
    }
  }, [product, isAuthenticated, navigate, addToWishlist, removeFromWishlist, isInWishlist, toast]);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl border-none',
        isCompact ? 'min-h-[320px]' : 'min-h-[400px]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <Link to={`/products/${product.id}`}>
          <img
            src={product.images[0]?.url || FALLBACK_IMAGE}
            alt={product.name}
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.featured && (
            <Badge
              variant="secondary"
              className="bg-purple-600 text-white px-2.5 py-0.5 text-xs font-medium rounded-full transition-all duration-200 hover:bg-purple-700"
            >
              Featured
            </Badge>
          )}
          {!product.inStock && (
            <Badge
              variant="destructive"
              className="bg-red-600 text-white px-2.5 py-0.5 text-xs font-medium rounded-full transition-all duration-200 hover:bg-red-700"
            >
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Quick action buttons */}
        <div
          className={cn(
            'absolute bottom-3 left-0 right-0 flex justify-center gap-2 transition-all duration-300',
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full bg-white/95 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200"
            onClick={toggleWishlist}
            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-colors duration-200',
                isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
          </Button>
          {product.inStock && (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full bg-white/95 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200"
              onClick={() => addToCart(product.id, 1, null)}
              disabled={isInCart(product.id)}
              aria-label={isInCart(product.id) ? 'Already in cart' : 'Add to cart'}
            >
              <ShoppingCart
                className={cn(
                  'h-5 w-5 transition-colors duration-200',
                  isInCart(product.id) ? 'text-gray-400' : 'text-gray-600'
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col justify-between gap-3">
        <div>
          <Link to={`/products/${product.id}`}>
            <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight hover:text-blue-600 transition-colors duration-200">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 capitalize mt-1">{product.brand}</p>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
          {showAdminActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit?.(product)}
                className="text-xs font-medium text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label={`Edit ${product.name}`}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteProduct?.(product.id)}
                disabled={isDeleting === product.id}
                className="text-xs font-medium text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
                aria-label={`Delete ${product.name}`}
              >
                {isDeleting === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse min-h-[320px]">
      <Skeleton className="aspect-[4/3] bg-gray-200 rounded-xl mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-5 bg-gray-200 rounded-full w-3/4" />
        <Skeleton className="h-4 bg-gray-200 rounded-full w-1/2" />
        <Skeleton className="h-6 bg-gray-200 rounded-full w-1/4" />
      </div>
    </div>
  );
};

export default ProductCard;