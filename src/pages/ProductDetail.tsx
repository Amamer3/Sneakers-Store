import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Heart, ShoppingCart, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { productService } from '@/services/product-service';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  description?: string;
  sizes?: string[];
  category: string;
  inStock: boolean;
  featured: boolean;
  images: { id: string; url: string }[];
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProduct(id!);
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        if (data.images && data.images.length > 0) {
          setSelectedImage(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }
    fetchProduct();
  }, [id, toast]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast({
        title: "Please select a size",
        description: "You must select a size before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id, 1, selectedSize);
      toast({
        title: "Added to cart",
        description: `${product.name}${selectedSize ? ` (Size ${selectedSize})` : ''} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast({
        title: "Please select a size",
        description: "You must select a size to proceed to checkout.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBuyingNow(true);
      const buyNowItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        size: selectedSize,
        image: product.images[0]?.url
      };
      window.sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
      navigate('/checkout');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to proceed to checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    try {
      setTogglingWishlist(true);
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        });
      } else {
        await addToWishlist(product.id);
        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTogglingWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600 text-lg">Product not found.</p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{product.name} | Your Store</title>
        <meta
          name="description"
          content={product.description || `${product.name} by ${product.brand}`}
        />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {product.images?.length > 0 ? (
              <>
                <div className="aspect-square bg-white rounded-lg overflow-hidden">
                  <img
                    src={product.images[selectedImage]?.url || '/placeholder-image.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = '/placeholder-image.jpg')}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={image.url || '/placeholder-image.jpg'}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = '/placeholder-image.jpg')}
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No images available</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-lg text-gray-600 mt-1">{product.brand}</p>
              <p className="text-2xl font-bold text-primary mt-2">
                {formatPrice(product.price)}
              </p>
            </div>

            {product.description && (
              <p className="text-gray-600">{product.description}</p>
            )}

            {product.sizes?.length > 0 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'default' : 'outline'}
                      onClick={() => setSelectedSize(size)}
                      className="w-full"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.inStock || addingToCart || buyingNow}
              >
                {addingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-2" />
                )}
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleBuyNow}
                disabled={!product.inStock || buyingNow || addingToCart}
                variant="secondary"
              >
                {buyingNow ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {product.inStock ? 'Buy Now' : 'Out of Stock'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleWishlistToggle}
                disabled={togglingWishlist}
                className={isInWishlist(product.id) ? 'bg-pink-50 text-pink-600 hover:bg-pink-100' : ''}
              >
                {togglingWishlist ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart
                    className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`}
                  />
                )}
              </Button>
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Availability:</span>
                <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductDetail);