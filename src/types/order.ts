import { ReactNode } from "react";

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  zipCode?: string;
  phone: string; // Required phone number
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

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';

export interface Order {
  shippingAddress: Address;
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  shipping: ShippingInfo;
  user: UserInfo;
  createdAt: string | Date;
  updatedAt: string | Date;
  paymentReference?: string;
  tax: number;
  deliveryFee: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasMore: boolean;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  name?: string;
  price: number;
  image?: string;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  shippingAddress: Address;
  total: number;
  paymentReference?: string;
  status?: 'pending' | 'processing' | 'failed' | 'success';
  tax: number;
  deliveryFee: number;
}

export interface UpdateOrderStatusInput {
  status: Order['status'];
}
