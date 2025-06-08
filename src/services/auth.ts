import apiClient from '@/lib/api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  token: string;
  customer: {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin';
  };
}

const formatToken = (token: string) => {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

const clearAuthToken = () => {
  console.debug('Auth Service - Clearing token from storage and headers');
  localStorage.removeItem('token');
  delete apiClient.defaults.headers.common['Authorization'];
};

const setAuthToken = (token: string) => {
  if (!token) {
    console.debug('Auth Service - Clearing token as empty token provided');
    clearAuthToken();
    return;
  }
  
  const formattedToken = formatToken(token);
  console.debug('Auth Service - Setting token:', formattedToken);
  
  localStorage.setItem('token', formattedToken);
  apiClient.defaults.headers.common['Authorization'] = formattedToken;
  console.debug('Auth Service - Token set in localStorage and headers');
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.debug('Auth Service - Attempting login');
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      console.debug('Auth Service - Login response received:', response.data);
      
      if (response.data.token) {
        setAuthToken(response.data.token);
        console.debug('Auth Service - Login successful, token set');
      } else {
        console.error('Auth Service - No token received from login');
        throw new Error('No token received from login');
      }
      return response.data;
    } catch (error) {
      console.error('Auth Service - Login error:', error);
      clearAuthToken();
      throw error;
    }
  },

  async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/admin/login', credentials);
      if (response.data.token) {
        setAuthToken(response.data.token);
        console.debug('Admin login successful, token set');
      } else {
        throw new Error('No token received from admin login');
      }
      return response.data;
    } catch (error) {
      clearAuthToken();
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async registerAdmin(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('Registering new admin:', { name: data.name, email: data.email });
      const response = await apiClient.post<AuthResponse>('/auth/admin/register', data);
      console.log('Admin registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error registering admin:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getCurrentCustomer(): Promise<AuthResponse['customer']> {
    console.debug('Auth Service - Getting current customer');
    try {
      const token = localStorage.getItem('token');
      console.debug('Auth Service - Token from localStorage:', token ? 'exists' : 'null');
      
      if (!token) {
        console.debug('Auth Service - No token found for getCurrentCustomer');
        throw new Error('No token found');
      }

      const response = await apiClient.get<AuthResponse['customer']>('/auth/me');
      console.debug('Auth Service - Current customer retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('Auth Service - getCurrentCustomer error:', error);
      clearAuthToken();
      throw error;
    }
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }
};
