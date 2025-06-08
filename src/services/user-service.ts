import apiClient from '@/lib/api-client';
import { User, PaginatedResponse, CreateUserInput, UpdateUserInput } from '@/types/user';

export type { User, PaginatedResponse, CreateUserInput, UpdateUserInput };

export const userService = {
  // Get all users (Admin only)
  getUsers: async (page = 1, limit = 10, search = ''): Promise<PaginatedResponse<User>> => {
    try {
      console.log('Fetching users with params:', { page, limit, search });
      
      const response = await apiClient.get<PaginatedResponse<User>>('/users', {
        params: {
          page,
          limit,
          search
        }
      });
      
      console.log('Users API response:', response.data);
      
      if (!response.data || !Array.isArray(response.data.items)) {
        console.error('Invalid API response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Create new user (Admin only)
  createUser: async (userData: CreateUserInput): Promise<User> => {
    try {
      console.log('Creating user:', userData);
      const response = await apiClient.post<User>('/users', userData);
      console.log('Create user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Update user (Admin only)
  updateUser: async (userId: string, userData: UpdateUserInput): Promise<User> => {
    try {
      console.log('Updating user:', { userId, userData });
      const response = await apiClient.put<User>(`/users/${userId}`, userData);
      console.log('Update user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Delete user (Admin only)
  deleteUser: async (userId: string): Promise<void> => {
    try {
      console.log('Deleting user:', userId);
      await apiClient.delete(`/users/${userId}`);
      console.log('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
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
