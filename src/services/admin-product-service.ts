import apiClient from '@/lib/api-client';
import type { Product, ProductFilters } from '@/types/product';
import { type Currency } from '@/context/CurrencyContext';

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProductCreateInput {
  name: string;
  brand: string;
  price: number; // Price in GHS
  description?: string;
  sizes?: string[];
  category: string;
  inStock: boolean;
  featured?: boolean;
  currency?: Currency; // Optional currency parameter
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

interface ImageReorderInput {
  imageIds: string[];
}

export const adminProductService = {
  createProduct: async (data: ProductCreateInput): Promise<Product> => {
    // Store prices in GHS
    const response = await apiClient.post('/products', {
      ...data,
      price: Number(data.price.toFixed(2)), // Ensure 2 decimal places
      currency: 'GHS' // Explicitly set currency to GHS
    });
    return response.data;
  },

  getProducts: async (filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams();
      // Always include images in the response
      queryParams.append('include', 'images');
      queryParams.append('currency', 'GHS'); // Request prices in GHS
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/products?${queryParams.toString()}`);
      console.debug('[AdminProductService] Products response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AdminProductService] Error in getProducts:', error);
      throw error;
    }
  },

  updateProduct: async (id: string, data: ProductUpdateInput): Promise<Product> => {
    // If price is being updated, ensure it's in GHS
    const updateData = {
      ...data,
      currency: 'GHS'
    };
    if (data.price !== undefined) {
      updateData.price = Number(data.price.toFixed(2));
    }
    const response = await apiClient.put(`/products/${id}`, updateData);
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}?currency=GHS`);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },  
  uploadImages: async (productId: string, files: File[]): Promise<Array<{ id: string; url: string }>> => {
    // Validate files
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    // Validate each file
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`File ${file.name} type not supported. Please upload JPEG, PNG, or WebP images.`);
      }
    });

    // Create form data
    const formData = new FormData();
    
    // Add each file to the form data with the field name 'images'
    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      console.debug('[AdminProductService] Uploading images:', {
        productId,
        fileCount: files.length,
        fileDetails: files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }))
      });
      
      const response = await apiClient.post(`/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120 seconds for multiple files
      });      console.debug('[AdminProductService] Image upload response:', response.data);
      
      // Ensure we always return an array of image objects
      const images = response.data;
      return Array.isArray(images) ? images : [images];
    } catch (error: any) {
      console.error('[AdminProductService] Image upload error:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      if (error.response?.status === 413) {
        throw new Error('Total file size too large. Please try uploading fewer or smaller images.');
      } else if (error.response?.status === 415) {
        throw new Error('One or more files are not in a supported format. Please use JPEG, PNG, or WebP.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error while uploading images. The files may be corrupted or too large to process.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please try again with fewer or smaller images.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload images');
    }
  },

  // For backward compatibility
  uploadImage: async (productId: string, file: File): Promise<{ id: string; url: string }> => {
    const results = await adminProductService.uploadImages(productId, [file]);
    return results[0];
  },

  removeImage: async (productId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/images/${imageId}`);
  },

  reorderImages: async (productId: string, data: ImageReorderInput): Promise<void> => {
    await apiClient.put(`/products/${productId}/images/reorder`, data);
  }
};
