import React, { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

declare global {
  interface Window {
    analytics?: {
      page(arg0: { productId: string; productName: string; category: string; brand: string; }): unknown;
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HeroCarousel from '@/components/HeroCarousel';
import PromoBanner from '@/components/PromoBanner';
import { Star, Truck, Shield, HeadphonesIcon, Loader2 } from 'lucide-react';
import { productService } from '@/services/product-service';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/context/CurrencyContext';
import EmptyState from '@/components/EmptyState';

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
  category: string;
  inStock: boolean;
  featured: boolean;
  images: Image[];
}

interface ProductFilters {
  page: number;
  limit: number;
  sort: string;
  category: string;
  brand: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
}

interface FilterOptions {
  categories: string[];
  brands: string[];
  priceRange: { min: number; max: number };
}

interface ApiError extends Error {
  message: string;
  status?: number;
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

const Index = () => {
  // Get currency formatting function
  const { formatPrice } = useCurrency();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: ['all'],
    brands: ['all'],
    priceRange: { min: 0, max: 0 },
  });
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    sort: '',
    category: 'all',
    brand: 'all',
    minPrice: undefined,
    maxPrice: undefined,
    inStock: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic',
      delay: 0,
      disable: 'mobile', // Disable animations on mobile for performance
    });    // Track page view
    try {
      if (typeof window !== 'undefined' && 'analytics' in window) {
        (window as any).analytics?.page({
          name: 'Home',
          path: '/',
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const options = await productService.getFilterOptions();
      setFilterOptions({
        categories: ['all', ...options.categories],
        brands: ['all', ...options.brands],
        priceRange: options.priceRange,
      });
      setCategories(['all', ...options.categories]);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter options. Some filters may be unavailable.',
        variant: 'destructive',
        className: 'aria-live-region',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const fetchProducts = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      console.debug('[Index] Fetching products with filters:', filters);

      // First fetch regular products
      const response = await productService.getProducts({
        ...filters,
        featured: false,
      });

      console.debug('[Index] Regular products response:', response);

      setProducts((prevProducts) =>
        filters.page === 1 ? response.items : [...prevProducts, ...response.items]
      );

      // Fetch featured products only if not already loaded
      if (filters.page === 1 && featuredProducts.length === 0) {
        console.debug('[Index] Fetching featured products');
        const featuredResponse = await productService.getProducts({
          page: 1,
          limit: 6,
          featured: true,
          sort: 'createdAt',
        });
        console.debug('[Index] Featured products response:', featuredResponse);
        setFeaturedProducts(featuredResponse.items);
      }
    } catch (error: any) {
      console.error('[Index] Error fetching products:', error);

      // Retry logic for network errors
      if (retryCount < 3 && (!error.response || error.response.status >= 500)) {
        console.debug(`[Index] Retrying fetch (attempt ${retryCount + 1} of 3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchProducts(retryCount + 1);
      }

      const errorMessage =
        error instanceof Error
          ? error.message === 'No products found'
            ? 'No products found matching your criteria'
            : error.message
          : 'An unexpected error occurred while loading products';

      setError(errorMessage);
      
      if (filters.page === 1) {
        setProducts([]);
        setFeaturedProducts([]);
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        className: 'aria-live-region',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, featuredProducts.length, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const debouncedFilterChange = useDebounce((key: keyof ProductFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  }, 300);

  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      debouncedFilterChange('category', category);
      if (window?.analytics) {
        window.analytics.track('Category Selected', {
          category,
        });
      }
    },
    [debouncedFilterChange]
  );

  const handleFilterChange = useCallback(
    (key: keyof ProductFilters, value: any) => {
      debouncedFilterChange(key, value);
    },
    [debouncedFilterChange]
  );

  const handlePriceRangeChange = useCallback(
    (min: number, max: number) => {
      setFilters((prev) => ({
        ...prev,
        minPrice: min,
        maxPrice: max,
        page: 1,
      }));
    },
    []
  );

  const handleSortChange = useCallback(
    (value: string) => {
      handleFilterChange('sort', value);
    },
    [handleFilterChange]
  );

  const handleLoadMore = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
    if (window?.analytics) {
      window.analytics.track('Load More Products', {
        page: filters.page + 1,
      });
    }
  }, [filters.page]);

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over ₵1,150',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment processing',
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Round-the-clock customer service',
    },
    {
      icon: Star,
      title: 'Quality Guarantee',
      description: 'Premium quality guaranteed',
    },
  ];

  const getEmptyStateTitle = (category: string, filters: ProductFilters): string => {
    if (category !== 'all') {
      return `No Products in ${category} Category`;
    }
    if (filters.brand !== 'all') {
      return `No Products from ${filters.brand}`;
    }
    if (filters.minPrice || filters.maxPrice) {
      return 'No Products in Price Range';
    }
    return 'Our Store is Getting Ready';
  };

  const getEmptyStateMessage = (category: string, filters: ProductFilters): string => {
    if (category !== 'all') {
      return `We haven't added any products to the ${category} category yet. Please check other categories or come back later.`;
    }
    if (filters.brand !== 'all') {
      return `We couldn't find any products from ${filters.brand}. Try different filters or check back later.`;
    }
    if (filters.minPrice || filters.maxPrice) {
      return `No products found in the selected price range. Try adjusting your filters.`;
    }
    return "We're working on bringing you an amazing collection of products. Check back soon for updates!";
  };

  return (
    <ErrorBoundary fallback={<div className="text-red-500 p-5 text-center">Error rendering page</div>}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Hero Section with Carousel */}
        <section className="relative" aria-hidden="true" data-aos="fade-up">
          <HeroCarousel />
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="text-center group"
                  data-aos="fade-up"
                  data-aos-delay={index * 150}
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notification Demo */}
        <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12" data-aos="fade-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Real-time <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Notifications</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Stay updated with order status, promotions, and important announcements
              </p>
            </div>
            <div data-aos="fade-up" data-aos-delay="200">
              
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16" data-aos="fade-up">
              <div className="inline-block p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                <div className="bg-white rounded-full px-6 py-2">
                  <span
                    className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    aria-hidden="true"
                  >
                    FEATURED COLLECTION
                  </span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Trending <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sneakers</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Hand-picked selection of the most popular and trending sneakers from top brands
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoading && filters.page === 1 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={`featured-skeleton-${i}`} data-aos="fade-up" data-aos-delay={i * 100}>
                    <ProductCardSkeleton />
                  </div>
                ))
              ) : featuredProducts.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title="Featured Products Coming Soon"
                    message="We're curating an exciting collection of featured products. Stay tuned for amazing deals and premium selections!"
                    icon="products"
                    onRetry={fetchProducts}
                  />
                </div>
              ) : (
                featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="transform hover:scale-105 transition-transform duration-300"
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >                    <ProductCard product={product} formatPrice={formatPrice} />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* All Products */}
        <section id="products" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Complete <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Collection</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Browse our complete range of premium sneakers
              </p>
            </div>

            {/* Filter Controls */}
            <div className="mb-12" data-aos="fade-up" data-aos-delay="100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div> 
                  <label htmlFor="category-filter" className="text-sm font-semibold text-gray-900">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        className="capitalize rounded-full px-4 py-1 text-sm font-semibold hover:bg-blue-50 transition-colors duration-300"
                        aria-pressed={selectedCategory === category}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="brand-filter" className="text-sm font-semibold text-gray-900">
                    Brand
                  </label>
                  <Select
                    value={filters.brand}
                    onValueChange={(value) => handleFilterChange('brand', value)}
                  >
                    <SelectTrigger id="brand-filter" className="mt-2 rounded-md border-gray-300">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="sort-filter" className="text-sm font-semibold text-gray-900">
                    Sort By
                  </label>
                  <Select
                    value={filters.sort}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger id="sort-filter" className="mt-2 rounded-md border-gray-300">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Newest First</SelectItem>
                      <SelectItem value="-createdAt">Oldest First</SelectItem>
                      <SelectItem value="price">Price: Low to High</SelectItem>
                      <SelectItem value="-price">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
                      <SelectItem value="-name">Name: Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900">Price Range</label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      min={0}
                      value={filters.minPrice || ''}
                      onChange={(e) =>
                        handlePriceRangeChange(
                          e.target.value ? Number(e.target.value) : undefined,
                          filters.maxPrice
                        )
                      }
                      className="rounded-md border-gray-300"
                      aria-label="Minimum price"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      min={0}
                      value={filters.maxPrice || ''}
                      onChange={(e) =>
                        handlePriceRangeChange(
                          filters.minPrice,
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="rounded-md border-gray-300"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading && filters.page === 1 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={`skeleton-${i}`} data-aos="fade-up" data-aos-delay={i * 100}>
                    <ProductCardSkeleton />
                  </div>
                ))
              ) : products.length > 0 ? (
                products.map((product, index) => (
                  <div
                    key={product.id}
                    className="transform hover:scale-105 transition-transform duration-300"
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >                    <ProductCard product={product} formatPrice={formatPrice} />
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    title={getEmptyStateTitle(selectedCategory, filters)}
                    message={getEmptyStateMessage(selectedCategory, filters)}
                    onRetry={fetchProducts}
                    icon="products"
                  />
                </div>
              )}
            </div>

            {/* Load More Button */}
            {products.length > 0 && (
              <div className="mt-12 text-center" data-aos="fade-up" data-aos-delay="200">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  size="lg"
                  className="min-w-[220px] rounded-full border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-base font-semibold py-3 transition-all duration-300"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading More Products...
                    </>
                  ) : (
                    'Load More Products'
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Promotional Banner */}
        <section data-aos="fade-up" data-aos-delay="300" aria-hidden="true">
          <PromoBanner />
        </section>
      </div>
    </ErrorBoundary>
  );
};

export default Index;