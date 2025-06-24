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
      
      // Use admin endpoint for user management
      const response = await apiClient.get<PaginatedResponse<User>>('/admin/users', {
        params: {
          page,
          limit,
          search
        }
      });
      
      console.log('Users API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            throw new Error('Unauthorized to access user data');
          case 403:
            throw new Error('Insufficient permissions to view users');
          case 404:
            throw new Error('Users endpoint not found. Please contact support');
          case 500:
            throw new Error('Server error occurred while fetching users');
          default:
            throw new Error(data?.message || `Failed to fetch users with status ${status}`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to the server');
      } else {
        throw new Error(error.message || 'An unexpected error occurred while fetching users');
      }
    }
  },

  // Create new user (Admin only)
  createUser: async (userData: CreateUserInput): Promise<User> => {
    try {
      // Validate input data
      if (!userData.name?.trim() || !userData.email?.trim() || !userData.password?.trim()) {
        throw new Error('All fields (name, email, password) are required');
      }
      
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Please provide a valid email address');
      }
      
      // Sanitize data
      const sanitizedData = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: userData.role
      };
      
      console.log('Creating user:', {
        name: sanitizedData.name,
        email: sanitizedData.email,
        role: sanitizedData.role,
        passwordLength: sanitizedData.password.length
      });
      
      // Use admin endpoint for user creation
      const response = await apiClient.post<User>('/admin/users', sanitizedData);
      console.log('Create user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(data?.message || 'Invalid user data provided');
          case 401:
            throw new Error('Unauthorized to create users');
          case 403:
            throw new Error('Insufficient permissions to create users');
          case 404:
            throw new Error('User creation endpoint not found. Please contact support');
          case 409:
            throw new Error('A user with this email already exists');
          case 422:
            throw new Error(data?.message || 'Validation failed for user data');
          case 500:
            throw new Error('Server error occurred. Please try again later');
          default:
            throw new Error(data?.message || `User creation failed with status ${status}`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to the server');
      } else {
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  },

  // Update user (Admin only)
  updateUser: async (id: string, userData: UpdateUserInput): Promise<User> => {
    try {
      // Validate input data
      if (!id?.trim()) {
        throw new Error('User ID is required');
      }
      
      if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        throw new Error('Please provide a valid email address');
      }
      
      if (userData.name && !userData.name.trim()) {
        throw new Error('Name cannot be empty');
      }
      
      // Sanitize data
      const sanitizedData: UpdateUserInput = {};
      if (userData.name) sanitizedData.name = userData.name.trim();
      if (userData.email) sanitizedData.email = userData.email.trim().toLowerCase();
      if (userData.role) sanitizedData.role = userData.role;
      
      console.log('Updating user:', { id, sanitizedData });
      
      // Use admin endpoint for user updates
      const response = await apiClient.put<User>(`/admin/users/${id}`, sanitizedData);
      console.log('Update user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(data?.message || 'Invalid user data provided');
          case 401:
            throw new Error('Unauthorized to update users');
          case 403:
            throw new Error('Insufficient permissions to update users');
          case 404:
            throw new Error('User not found or endpoint not available');
          case 409:
            throw new Error('A user with this email already exists');
          case 422:
            throw new Error(data?.message || 'Validation failed for user data');
          case 500:
            throw new Error('Server error occurred while updating user');
          default:
            throw new Error(data?.message || `User update failed with status ${status}`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to the server');
      } else {
        throw new Error(error.message || 'An unexpected error occurred while updating user');
      }
    }
  },

  // Delete user (Admin only)
  deleteUser: async (id: string): Promise<void> => {
    try {
      // Validate input
      if (!id?.trim()) {
        throw new Error('User ID is required');
      }
      
      console.log('Deleting user:', id);
      
      // Use admin endpoint for user deletion
      await apiClient.delete(`/admin/users/${id}`);
      console.log('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(data?.message || 'Invalid user ID provided');
          case 401:
            throw new Error('Unauthorized to delete users');
          case 403:
            throw new Error('Insufficient permissions to delete users');
          case 404:
            throw new Error('User not found or already deleted');
          case 409:
            throw new Error('Cannot delete user due to existing dependencies');
          case 500:
            throw new Error('Server error occurred while deleting user');
          default:
            throw new Error(data?.message || `User deletion failed with status ${status}`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to the server');
      } else {
        throw new Error(error.message || 'An unexpected error occurred while deleting user');
      }
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
