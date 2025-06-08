export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'customer' | 'admin';
}
