import api from './api';

interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const adminLogin = async (email: string, password: string): Promise<AdminLoginResponse> => {
  const { data } = await api.post('/auth/admin/login', { email, password });
  
  if (data.user.role !== 'admin') {
    throw new Error('Not authorized as admin');
  }

  // Store the token and session data
  const formattedToken = data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`;
  localStorage.setItem('token', formattedToken);
  localStorage.setItem('userRole', data.user.role);
  localStorage.setItem('user', JSON.stringify(data.user));
  sessionStorage.setItem('isAdminAuthenticated', 'true');
  
  return data;
};

export const checkAdminAuth = (): boolean => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  const isAdminAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
  return !!token && role === 'admin' && isAdminAuthenticated === 'true';
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('user');
  sessionStorage.removeItem('isAdminAuthenticated');
  window.location.href = '/login';
};
