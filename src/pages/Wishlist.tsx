import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/product';
import { productService } from '@/services/product-service';


const Wishlist = () => {
  const { items: productIds, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
      delay: 100,
    });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productDetails = await Promise.all(
          productIds.map(id => productService.getProduct(id))
        );
        setProducts(productDetails);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load wishlist items",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [productIds, toast]);

  const handleAddToCart = async (product: Product) => {
    const itemId = product.id;
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to add items to your cart',
        action: <Button asChild size="sm" variant="outline"><Link to="/login">Login</Link></Button>,
      });
      return;
    }

    try {
      if (loadingItems.has(itemId)) return;
      setLoadingItems(prev => new Set([...prev, itemId]));

      if (!product.inStock) {
        toast({
          title: "Out of Stock",
          description: "This product is currently unavailable",
          variant: "destructive"
        });
        return;
      }

      if (product.sizes?.length > 0) {
        navigate(`/product/${product.id}`);
        toast({
          title: 'Select Size',
          description: 'Please choose a size on the product details page.',
        });
        return;
      }

      await addToCart(product.id, 1, null);
      await removeFromWishlist(itemId);

      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveFromWishlist = async (product: Product) => {
    const itemId = product.id;
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to manage your wishlist',
        action: <Button asChild size="sm" variant="outline"><Link to="/login">Login</Link></Button>,
      });
      return;
    }

    try {
      if (loadingItems.has(itemId)) return;
      setLoadingItems(prev => new Set([...prev, itemId]));

      await removeFromWishlist(itemId);
      
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} has been removed from your wishlist`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive"
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} className="animate-pulse border-gray-200 rounded-2xl shadow-lg">
                <CardContent className="p-6">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-4" />
                  <div className="space-y-3">
                    <div className="h-5 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-4 bg-gray-200 rounded-full w-1/2" />
                    <div className="flex justify-between items-center pt-4">
                      <div className="h-10 bg-gray-200 rounded-full w-32" />
                      <div className="h-10 bg-gray-200 rounded-full w-10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-aos="fade-up">
          <div className="text-center bg-white rounded-2xl shadow-lg p-10">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">Start shopping to add items to your wishlist</p>
            <Button
              asChild
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full text-base font-semibold transition-all duration-300"
            >
              <Link to="/">Browse Products</Link>
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
          <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-lg text-gray-600 mt-3">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <Card 
              key={product.id}
              className={`border-gray-200 rounded-2xl shadow-lg transition-all duration-300 ${
                loadingItems.has(product.id) ? 'opacity-75' : 'hover:shadow-xl hover:-translate-y-1'
              }`}
              data-aos="fade-up"
              data-aos-delay={String(index * 100)}
            >
              <CardContent className="p-6">
                <Link to={`/product/${product.id}`} className="group">
                  <div className="aspect-square relative rounded-xl overflow-hidden mb-4">
                    <img
                      src={product.images[0]?.url ?? '/fallback-image.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm bg-red-600 px-3 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </div>
                </Link>

                <Link to={`/product/${product.id}`} className="hover:text-indigo-600 transition-colors duration-300">
                  <h3 className="font-semibold text-xl text-gray-900 mb-2 truncate">{product.name}</h3>
                </Link>
                <p className="text-lg font-semibold text-gray-900 mb-4">${product.price.toFixed(2)}</p>

                <div className="flex justify-between items-center">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold py-2 mr-2 transition-all duration-300"
                    disabled={loadingItems.has(product.id) || !product.inStock}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    {loadingItems.has(product.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Add to Cart
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleRemoveFromWishlist(product)}
                    disabled={loadingItems.has(product.id)}
                    className="rounded-full bg-white/80 hover:bg-red-50 text-red-600 hover:text-red-700 shadow-md transition-all duration-300"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    {loadingItems.has(product.id) ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart className="h-5 w-5 fill-current" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;