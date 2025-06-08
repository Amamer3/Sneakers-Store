import apiClient from '@/lib/api-client';
import { Product } from '@/types/product';

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

import { ProductFilters } from '@/types/product';

interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// Parse sort string into field and direction
const parseSortOption = (sort: string): SortOption => {
  if (sort.startsWith('-')) {
    return { field: sort.substring(1), direction: 'desc' };
  }
  return { field: sort, direction: 'asc' };
};

// Validate price range
const validatePriceRange = (min?: number, max?: number) => {
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error('Minimum price cannot be greater than maximum price');
  }
  return { min, max };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const validateProductResponse = (data: any): data is ProductsResponse => {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.items)) return false;
  if (typeof data.total !== 'number') return false;
  if (typeof data.page !== 'number') return false;
  if (typeof data.limit !== 'number') return false;
  if (typeof data.totalPages !== 'number') return false;
  if (typeof data.hasMore !== 'boolean') return false;
  return true;
};

const handleApiError = (error: any): never => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const message = error.response.data?.message || 'An error occurred while fetching products';
    throw new ApiError(message, error.response.status);
  } else if (error.request) {
    // The request was made but no response was received
    throw new ApiError('No response received from server');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new ApiError(error.message || 'An error occurred while making the request');
  }
};

export const productService = {
  getProducts: async (filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      // Handle pagination
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      // Handle sorting with improved format
      if (filters.sort) {
        const { field, direction } = parseSortOption(filters.sort);
        queryParams.append('sort', `${field}:${direction}`);
      }

      // Handle filters with validation
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category.toLowerCase());
      }
      if (filters.brand && filters.brand !== 'all') {
        queryParams.append('brand', filters.brand.toLowerCase());
      }
      if (typeof filters.minPrice === 'number' && filters.minPrice >= 0) {
        queryParams.append('minPrice', filters.minPrice.toString());
      }
      if (typeof filters.maxPrice === 'number' && filters.maxPrice >= 0) {
        queryParams.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.inStock !== undefined) {
        queryParams.append('inStock', filters.inStock.toString());
      }
      if (filters.featured !== undefined) {
        queryParams.append('featured', filters.featured.toString());
      }

      const requestUrl = `/products?${queryParams.toString()}`;
      console.debug('[ProductService] Fetching products from:', requestUrl);

      const response = await apiClient.get(requestUrl);
      const data = response.data;

      console.debug('[ProductService] Product response:', data);

      // Make validation more lenient to handle slight format differences
      if (!data || !Array.isArray(data.items)) {
        console.error('[ProductService] Invalid response format:', data);
        throw new ApiError('Invalid response format from server');
      }

      return {
        items: data.items,
        total: data.total || data.items.length,
        page: data.page || 1,
        limit: data.limit || data.items.length,
        totalPages: data.totalPages || Math.ceil(data.items.length / (data.limit || 10)),
        hasMore: data.hasMore || false
      };
    } catch (error: any) {
      console.error('[ProductService] Error fetching products:', error);

      // Add more detailed error messages based on status codes
      if (error.response?.status === 404) {
        throw new ApiError('No products found', 404);
      } else if (error.response?.status === 401) {
        throw new ApiError('Unauthorized access', 401);
      } else if (error.response?.status === 403) {
        throw new ApiError('Access forbidden', 403);
      } else if (error.response?.status >= 500) {
        throw new ApiError('Server error. Please try again later', error.response.status);
      }

      throw new ApiError(
        error.response?.data?.message || error.message || 'Failed to fetch products',
        error.response?.status
      );
    }
  },

  // Get featured products
  getFeaturedProducts: async (limit: number = 6): Promise<ProductsResponse> => {
    return productService.getProducts({
      page: 1,
      limit,
      sort: 'createdAt',
      featured: true
    });
  },

  // Get single product details
  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    console.log('[ProductService] Single product response:', response);
    return response.data;
  },

  // Get product reviews
  getProductReviews: async (productId: string) => {
    const response = await apiClient.get(`/products/${productId}/reviews`);
    console.log('Product reviews response:', response);
    return response.data;
  },

  // Add product review
  addProductReview: async (productId: string, data: { rating: number; comment: string }) => {
    const response = await apiClient.post(`/products/${productId}/reviews`, data);
    return response.data;
  },

  // Update product review
  updateProductReview: async (productId: string, reviewId: string, data: { rating: number; comment: string }) => {
    const response = await apiClient.put(`/products/${productId}/reviews/${reviewId}`, data);
    return response.data;
  },

  // Delete product review
  deleteProductReview: async (productId: string, reviewId: string) => {
    const response = await apiClient.delete(`/products/${productId}/reviews/${reviewId}`);
    return response.data;
  },

  // Get available filter options (categories, brands, price range)
  getFilterOptions: async () => {
    try {
      const response = await productService.getProducts({
        page: 1,
        limit: 1000, // Get all products to extract filter options
        sort: 'createdAt'
      });      const products = response.items;
      
      // Extract unique values and filter out undefined/null values
      const categories = [...new Set(products.map(p => p.category))].filter((cat): cat is string => Boolean(cat));
      const brands = [...new Set(products.map(p => p.brand))].filter((brand): brand is string => Boolean(brand));
      
      // Calculate price range from valid prices
      const prices = products.map(p => p.price).filter((p): p is number => typeof p === 'number' && p > 0);
      const priceRange = {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0
      };

      return {
        categories,
        brands,
        priceRange
      };
    } catch (error) {
      console.error('Error deriving filter options:', error);
      return {
        categories: [],
        brands: [],
        priceRange: { min: 0, max: 0 }
      };
    }
  }
};
