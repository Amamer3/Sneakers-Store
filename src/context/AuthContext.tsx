import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useToast } from '@/hooks/use-toast';
import { cartService } from '@/services/cart-service';
import axios from 'axios';

interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved user on mount
    const initAuth = () => {
      try {
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
          // Ensure the role is either 'customer' or 'admin'
          const validatedUser: User = {
            ...savedUser,
            role: savedUser.role === 'admin' ? 'admin' : 'customer'
          };
          setUser(validatedUser);
          // Restore auth header
          const token = authService.getToken();
          if (token) {
            const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            axios.defaults.headers.common['Authorization'] = formattedToken;
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted auth data
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      // Validate and convert the role
      const validatedUser: User = {
        ...response.user,
        role: response.user.role === 'admin' ? 'admin' : 'customer'
      };
      setUser(validatedUser);

      // Merge localStorage cart with server cart
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const cartItems = JSON.parse(localCart);
        // Add each item to server cart
        for (const item of cartItems) {
          try {
            await cartService.addToCart(item.productId, item.quantity, item.size);
          } catch (error) {
            console.error('Error merging cart item:', error);
          }
        }
        // Clear localStorage cart after merging
        localStorage.removeItem('cart');
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.message || "Please check your credentials",
      });
      return false;
    }
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.adminLogin({ email, password });
      // For admin login, explicitly set role as admin
      const adminUser: User = {
        ...response.user,
        role: 'admin'
      };
      setUser(adminUser);
      toast({
        title: "Success",
        description: "Admin logged in successfully",
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Admin Login Failed",
        description: error.response?.data?.message || "Please check your credentials",
      });
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      // For new registrations, always set role as customer
      const newUser: User = {
        ...response.user,
        role: 'customer'
      };
      setUser(newUser);
      toast({
        title: "Success",
        description: "Registration successful",
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.message || "Failed to create account",
      });
      return false;
    }
  };

  const logout = async () => {
    authService.logout();
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    adminLogin,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
