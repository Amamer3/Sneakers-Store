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
  size?: string;
  color?: string;
  image: string;
  sku?: string;
  weight?: number;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  reference?: string;
  amount: number;
  currency: string;
  gateway?: string;
  gatewayResponse?: any;
  paidAt?: string | Date;
  refundedAt?: string | Date;
  refundAmount?: number;
  refundReason?: string;
  fees?: number;
}

export interface OrderTracking {
  id: string;
  orderId: string;
  status: OrderStatus;
  eventType: TrackingEventType;
  message: string;
  location?: string;
  timestamp: string | Date;
  updatedBy?: string;
  isSystemUpdate: boolean;
  metadata?: Record<string, any>;
}

export interface OrderDiscount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  description: string;
  appliedAmount: number;
  maxDiscount?: number;
  minOrderAmount?: number;
}



export interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: Address;
  method?: string;
  cost?: number;
}

export interface UserInfo {
  phone: string;
  id: string;
  email: string;
  name: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'failed';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'card' | 'cash' | 'paystack' | 'stripe' | 'paypal';
export type DiscountType = 'percentage' | 'fixed' | 'shipping';
export type TrackingEventType = 'created' | 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
  // Core fields
  id: string;
  orderNumber?: string;
  userId: string;
  
  // Order items and pricing
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  currency: string;
  
  // Status and lifecycle
  status: OrderStatus;
  
  // Customer information
  user: UserInfo;
  
  // Shipping information
  shipping: ShippingInfo;
  shippingAddress: Address;
  billingAddress?: Address;
  
  // Payment information
  payment?: PaymentInfo;
  paymentReference?: string; // Legacy field for backward compatibility
  
  // Discounts and coupons
  discounts?: OrderDiscount[];
  couponCode?: string;
  
  // Tracking and history
  trackingHistory?: OrderTracking[];
  trackingNumber?: string;
  estimatedDelivery?: string | Date;
  
  // Inventory management
  inventoryReservations?: InventoryReservation[];
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
  confirmedAt?: string | Date;
  shippedAt?: string | Date;
  deliveredAt?: string | Date;
  
  // Additional metadata
  notes?: string;
  internalNotes?: string;
  source?: string; // web, mobile, admin
  metadata?: Record<string, any>;
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

export interface OrderQueryParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
