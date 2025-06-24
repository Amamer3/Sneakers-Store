import axios from 'axios';

const API_URL = 'https://sneaker-server-7gec.onrender.com/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
  };
}

class AuthService {
  private setAuthHeader(token: string) {
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    axios.defaults.headers.common['Authorization'] = formattedToken;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    if (response.data.token) {
      const formattedToken = response.data.token.startsWith('Bearer ') ? response.data.token : `Bearer ${response.data.token}`;
      localStorage.setItem('token', formattedToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      this.setAuthHeader(formattedToken);
    }
    return response.data;
  }

  async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/admin/login`, credentials);
    if (response.data.token) {
      const formattedToken = response.data.token.startsWith('Bearer ') ? response.data.token : `Bearer ${response.data.token}`;
      localStorage.setItem('token', formattedToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      this.setAuthHeader(formattedToken);
    }
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
}

export const authService = new AuthService();
