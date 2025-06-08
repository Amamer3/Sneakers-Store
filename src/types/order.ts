import { ReactNode } from "react";

export interface Address {
  zipCode: ReactNode;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: Address;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface Order {
  shippingAddress: Address;
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  total: number;
  shipping: ShippingInfo;
  user: UserInfo;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateOrderInput {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: Address;
}

export interface UpdateOrderStatusInput {
  status: Order['status'];
}
