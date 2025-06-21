import apiClient from '@/lib/api-client';
import { User, PaginatedResponse, CreateUserInput, UpdateUserInput } from '@/types/user';

export type { User, PaginatedResponse, CreateUserInput, UpdateUserInput };

export interface UserAddress {
  id: string;
  userId: string;
  type: 'home' | 'work' | 'other';
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  type: 'home' | 'work' | 'other';
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  type?: 'home' | 'work' | 'other';
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  isDefault?: boolean;
}

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
  },

  // Get user by ID (authenticated)
  getUserById: async (userId: string): Promise<User> => {
    try {
      console.log('Fetching user by ID:', userId);
      const response = await apiClient.get<User>(`/users/${userId}`);
      console.log('Get user by ID response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user by ID:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Update user by ID (authenticated)
  updateUserById: async (userId: string, userData: UpdateUserInput): Promise<User> => {
    try {
      console.log('Updating user by ID:', { userId, userData });
      const response = await apiClient.put<User>(`/users/${userId}`, userData);
      console.log('Update user by ID response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user by ID:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Get user addresses
  getUserAddresses: async (): Promise<UserAddress[]> => {
    try {
      console.log('Fetching user addresses');
      const response = await apiClient.get<UserAddress[]>('/users/me/addresses');
      console.log('Get user addresses response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user addresses:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Create user address
  createUserAddress: async (addressData: CreateAddressInput): Promise<UserAddress> => {
    try {
      console.log('Creating user address:', addressData);
      const response = await apiClient.post<UserAddress>('/users/me/addresses', addressData);
      console.log('Create user address response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user address:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Update user address
  updateUserAddress: async (addressId: string, addressData: UpdateAddressInput): Promise<UserAddress> => {
    try {
      console.log('Updating user address:', { addressId, addressData });
      const response = await apiClient.put<UserAddress>(`/users/me/addresses/${addressId}`, addressData);
      console.log('Update user address response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user address:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  // Delete user address
  deleteUserAddress: async (addressId: string): Promise<void> => {
    try {
      console.log('Deleting user address:', addressId);
      await apiClient.delete(`/users/me/addresses/${addressId}`);
      console.log('User address deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user address:', error);
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
