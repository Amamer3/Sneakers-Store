import React, { useEffect, useState, useCallback } from 'react';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { useCurrency } from '@/context/CurrencyContext';
import { productService } from '@/services/product-service';
import EmptyState from '@/components/EmptyState';
import { Loader2 } from 'lucide-react';

const Products: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getProducts({ page: 1, limit: 24, sort: '', category: 'all', brand: 'all', minPrice: undefined, maxPrice: undefined, inStock: true });
      setProducts(response.items);
    } catch (err: any) {
      setError('Failed to load products. Please try again later.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
      <h1 className="text-3xl font-bold mb-10 text-center">All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        ) : error ? (
          <div className="col-span-full">
            <EmptyState title="Error" message={error} icon="products" onRetry={fetchProducts} />
          </div>
        ) : products.length > 0 ? (
          products.map((product: any) => (
            <ProductCard key={product.id} product={product} formatPrice={formatPrice} />
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState title="No Products Found" message="Please check back later for new arrivals!" icon="products" onRetry={fetchProducts} />
          </div>
        )}
      </div>
      {isLoading && (
        <div className="flex justify-center mt-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};

export default Products;
