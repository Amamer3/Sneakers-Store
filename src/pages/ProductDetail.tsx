import React, { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { productService } from '@/services/product-service';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  description?: string;
  sizes?: string[];
  category: string;
  inStock: boolean;
  images: Image[];
}

interface Review {
  id: string;
  user?: { name: string };
  rating: number;
  comment?: string;
  createdAt?: string;
}

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

// Fallback image (base64 SVG)
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="#6b7280">No Image</text></svg>';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const loadProduct = useCallback(async () => {
    if (!id) {
      setError('Product ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [productData, reviewsData] = await Promise.all([
        productService.getProduct(id),
        productService.getProductReviews(id),
      ]);

      setProduct(productData);
      setReviews(reviewsData);

      if (productData.sizes && productData.sizes.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }

      if (window?.analytics) {
        window.analytics.page({
          productId: productData.id,
          productName: productData.name,
          category: productData.category,
          brand: productData.brand,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product';
      setError(errorMessage.includes('404') ? 'Product not found' : 'Network error. Please try again.');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        className: 'aria-live-region',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const debouncedAddToCart = useDebounce(async (productId: string, quantity: number, size: string | null) => {
    try {
      await addToCart(productId, quantity, size);
      if (window?.analytics) {
        window.analytics.track('Product Added to Cart', {
          productId,
          productName: product!.name,
          price: product!.price,
          size,
        });
      }
      toast({
        title: 'Added to cart',
        description: `${product!.name}${size ? ` (Size: ${size})` : ''} has been added to your cart.`,
        className: 'aria-live-region',
      });
    } catch (err) {
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
            productName: product!.name,
          });
        }
        toast({
          title: 'Removed from wishlist',
          description: `${product!.name} has been removed from your wishlist.`,
          className: 'aria-live-region',
        });
      } else {
        await addToWishlist(productId);
        if (window?.analytics) {
          window.analytics.track('Product Added to Wishlist', {
            productId,
            productName: product!.name,
          });
        }
        toast({
          title: 'Added to wishlist',
          description: `${product!.name} has been added to your wishlist.`,
          className: 'aria-live-region',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
        variant: 'destructive',
        className: 'aria-live-region',
      });
    }
  }, 300);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;

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

    if (!selectedSize && product.sizes?.length > 0) {
      toast({
        title: 'Size Required',
        description: 'Please select a size before adding to cart.',
        variant: 'destructive',
        className: 'aria-live-region',
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      await debouncedAddToCart(product.id, 1, selectedSize || null);
    } finally {
      setIsAddingToCart(false);
    }
  }, [isAuthenticated, selectedSize, product, debouncedAddToCart, navigate, toast]);

  const handleWishlist = useCallback(async () => {
    if (!product) return;

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
  }, [isAuthenticated, product, isInWishlist, debouncedWishlist, navigate, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center bg-white rounded-2xl shadow-xl p-10 animate-in fade-in duration-500">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Error Loading Product</h2>
            <p className="text-lg text-gray-600 mb-8">{error}</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => navigate(-1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={loadProduct}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300"
                aria-label="Retry loading product"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-1/3 mb-10 rounded-full" />
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4 rounded-full" />
              <Skeleton className="h-6 w-1/2 rounded-full" />
              <Skeleton className="h-6 w-1/4 rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="text-red-500 p-5 text-center">Error rendering product page</div>}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300 mb-10"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-all duration-300" />
            <span className="text-base font-semibold">Back to Products</span>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 transition-all duration-500">
                <img
                  src={product!.images?.[selectedImage]?.url || FALLBACK_IMAGE}
                  alt={product!.name || 'Product image'}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={e => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                {!product!.inStock && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product!.images?.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === index
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-400 hover:shadow-md hover:scale-105'
                    }`}
                    aria-label={`View image ${index + 1} of ${product!.name}`}
                  >
                    <img
                      src={image.url || FALLBACK_IMAGE}
                      alt={`${product!.name || 'Product'} image ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-opacity duration-300 hover:opacity-95"
                      onError={e => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="relative">
              <div className="space-y-8 bg-white p-8 rounded-2xl shadow-lg animate-in fade-in duration-500">
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold text-gray-900 leading-tight">{product!.name || 'Unnamed Product'}</h1>
                  <p className="text-xl text-gray-500 font-medium">{product!.brand || 'Unknown Brand'}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-3xl font-bold text-gray-900">{formatPrice(product!.price)}</p>
                  {product!.inStock ? (
                    <p className="text-sm text-green-600 font-semibold">In Stock</p>
                  ) : (
                    <p className="text-sm text-red-600 font-semibold">Out of Stock</p>
                  )}
                </div>

                {product!.sizes?.length > 0 && (
                  <div className="space-y-3">
                    <label
                      htmlFor={`size-select-${product!.id}`}
                      className="text-sm font-semibold text-gray-900"
                      aria-required={true}
                    >
                      Select Size
                    </label>
                    <Select
                      value={selectedSize}
                      onValueChange={setSelectedSize}
                      disabled={!product!.inStock}
                    >
                      <SelectTrigger
                        id={`size-select-${product!.id}`}
                        className="w-full border-gray-300 focus:ring-blue-500 rounded-lg text-base py-3"
                        aria-label="Select product size"
                      >
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {product!.sizes.map((size) => (
                          <SelectItem key={size} value={size} className="text-base">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <p className="text-gray-600 leading-relaxed text-base">{product!.description || 'No description available.'}</p>
                </div>
              </div>

              {/* Sticky Action Bar */}
              <div className="sticky bottom-0 bg-white p-6 rounded-t-2xl shadow-xl border-t border-gray-200 mt-6 z-10">
                <div className="flex space-x-4">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                    disabled={isAddingToCart || !product!.inStock || (product!.sizes?.length > 0 && !selectedSize)}
                    aria-label={`Add ${product!.name} to cart`}
                    aria-busy={isAddingToCart}
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 mr-2" />
                    )}
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleWishlist}
                    className="flex-1 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-base font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                    disabled={isUpdatingWishlist}
                    aria-label={isInWishlist(product!.id) ? `Remove ${product!.name} from wishlist` : `Add ${product!.name} to wishlist`}
                    aria-busy={isUpdatingWishlist}
                  >
                    {isUpdatingWishlist ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Heart
                        className={`h-5 w-5 mr-2 ${isInWishlist(product!.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                      />
                    )}
                    {isUpdatingWishlist ? 'Updating...' : isInWishlist(product!.id) ? 'In Wishlist' : 'Add to Wishlist'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-10">Customer Reviews</h2>
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <Card className="border-gray-200 rounded-2xl shadow-lg">
                  <CardContent className="py-10 text-center">
                    <p className="text-gray-500 text-lg font-medium">No reviews yet</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card
                    key={review.id}
                    className="border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                    aria-describedby={`review-${review.id}-rating`}
                  >
                    <CardContent className="py-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{review.user?.name || 'Anonymous'}</p>
                          <div className="flex items-center mt-2">
                            <span className="sr-only" id={`review-${review.id}-rating`}>
                              Rated {review.rating} out of 5 stars
                            </span>
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 15.585l-6.327 3.89 1.42-7.336L.18 7.14l7.354-.635L10 0l2.466 6.505 7.354.635-4.913 4.999 1.42 7.336L10 15.585z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'Unknown Date'}
                        </span>
                      </div>
                      <p className="mt-4 text-gray-600 leading-relaxed">{review.comment || 'No comment provided.'}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            {reviews.length > 10 && (
              <p className="text-sm text-gray-600 mt-4">
                Note: For performance, consider implementing pagination for reviews.
              </p>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductDetail;