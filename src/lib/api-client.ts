import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/hooks/use-toast';


interface CustomRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  _retry?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ;
// || 'https://sneaker-server-7gec.onrender.com/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; 
class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  async get(endpoint: string) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      return { data, status: response.status };
    } catch (error: any) {
      console.error(`[API] Error for ${endpoint}:`, { status: error.status, data: error.data, message: error.message });
      throw error;
    }
  }
  
  async post(endpoint: string, data: any) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const responseData = await response.json();
      return { data: responseData, status: response.status };
    } catch (error: any) {
      console.error(`[API] Error for ${endpoint}:`, { status: error.status, data: error.data, message: error.message });
      throw error;
    }
  }
  
  async patch(endpoint: string, data?: any) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        ...(data && { body: JSON.stringify(data) })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const responseData = await response.json();
      return { data: responseData, status: response.status };
    } catch (error: any) {
      console.error(`[API] Error for ${endpoint}:`, { status: error.status, data: error.data, message: error.message });
      throw error;
    }
  }
  
  async delete(endpoint: string) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const responseData = await response.json();
      return { data: responseData, status: response.status };
    } catch (error: any) {
      console.error(`[API] Error for ${endpoint}:`, { status: error.status, data: error.data, message: error.message });
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
const INITIAL_TIMEOUT = 30000; 

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: INITIAL_TIMEOUT,
});

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if we're rate limited
const isRateLimited = (error: AxiosError) => error.response?.status === 429;

// Check if it's a server error
const isServerError = (error: AxiosError) => {
  if (!error.response) return true; // Network error
  return error.response.status >= 500 || error.code === 'ECONNABORTED' || error.message.includes('timeout');
};

// Request interceptor
axiosClient.interceptors.request.use(
  async (config: CustomRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    
    // Add retry count to config
    config.retryCount = config.retryCount || 0;
    
    // Log outgoing request in development
    if (import.meta.env.DEV) {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to check if the request is for an admin endpoint
const isAdminEndpoint = (url: string | undefined) => {
  return url?.includes('/api/admin/');
};

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.debug(`[API] Response from ${response.config.url}:`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle retries for server errors and rate limiting
    if ((isServerError(error) || isRateLimited(error)) && originalRequest.retryCount < MAX_RETRIES) {
      originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;
      
      // Increase timeout for subsequent retries
      originalRequest.timeout = INITIAL_TIMEOUT * (originalRequest.retryCount + 1);
      
      // Calculate delay with exponential backoff for rate limiting
      const delay = isRateLimited(error) 
        ? RETRY_DELAY * Math.pow(2, originalRequest.retryCount - 1)
        : RETRY_DELAY * originalRequest.retryCount;
      
      // Wait before retrying
      await wait(delay);
      
      // Show retry toast
      toast({
        title: 'Retrying request',
        description: `Attempt ${originalRequest.retryCount} of ${MAX_RETRIES}...`,
        duration: 2000,
      });

      return axiosClient(originalRequest);
    }

    // Log error details in development
    if (import.meta.env.DEV) {
      console.error(`[API] Error for ${originalRequest.url}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    return Promise.reject(error);
  }
);

// Function to refresh the auth token
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });

    const { token } = response.data;
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    localStorage.setItem('token', formattedToken);
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return null;
  }
};

// Helper to get consistent error messages
function getErrorMessage(error: AxiosError): string {
  if (!error.response) {
    return 'Network error: Please check your connection and try again.';
  }
  
  const status = error.response.status;
  const data = error.response.data as any;

  // Try to get message from response data
  const serverMessage = data?.message || data?.error;
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage;
  }

  // Default messages based on status code
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

export default axiosClient;
