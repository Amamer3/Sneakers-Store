import apiClient from '@/lib/api-client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  slug?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  slug?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    try {
      console.log('Fetching categories');
      const response = await apiClient.get<Category[]>('/categories');
      console.log('Categories API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Create category (Admin only)
  createCategory: async (categoryData: CreateCategoryInput): Promise<Category> => {
    try {
      console.log('Creating category:', categoryData);
      const response = await apiClient.post<Category>('/categories', categoryData);
      console.log('Create category response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Update category (Admin only)
  updateCategory: async (categoryId: string, categoryData: UpdateCategoryInput): Promise<Category> => {
    try {
      console.log('Updating category:', { categoryId, categoryData });
      const response = await apiClient.put<Category>(`/categories/${categoryId}`, categoryData);
      console.log('Update category response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Delete category (Admin only)
  deleteCategory: async (categoryId: string): Promise<void> => {
    try {
      console.log('Deleting category:', categoryId);
      await apiClient.delete(`/categories/${categoryId}`);
      console.log('Category deleted successfully');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  }
};