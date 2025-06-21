import apiClient from '@/lib/api-client';
import { OrderDiscount, DiscountType } from '@/types/order';

export interface Coupon {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  description: string;
  isActive: boolean;
  startDate: string | Date;
  endDate: string | Date;
  usageLimit?: number;
  usageCount: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  userLimit?: number;
  isFirstTimeOnly?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discount?: OrderDiscount;
  error?: string;
  message?: string;
}

export interface ApplyCouponRequest {
  code: string;
  orderTotal: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  userId?: string;
}

export interface CouponUsageStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUsage: number;
  totalDiscount: number;
  topCoupons: Array<{
    code: string;
    usageCount: number;
    totalDiscount: number;
  }>;
}

interface CouponServiceInterface {
  // User endpoints
  validateCoupon(request: ApplyCouponRequest): Promise<CouponValidationResult>;
  applyCoupon(request: ApplyCouponRequest): Promise<OrderDiscount>;
  getUserCoupons(): Promise<Coupon[]>;
  
  // Admin endpoints
  getAllCoupons(): Promise<Coupon[]>;
  getCouponById(id: string): Promise<Coupon>;
  createCoupon(coupon: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon>;
  updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon>;
  deleteCoupon(id: string): Promise<void>;
  getCouponStats(): Promise<CouponUsageStats>;
  
  // Utility methods
  calculateDiscount(coupon: Coupon, orderTotal: number, items?: any[]): number;
  isCouponExpired(coupon: Coupon): boolean;
  canUserUseCoupon(coupon: Coupon, userId?: string): Promise<boolean>;
}

export const couponService: CouponServiceInterface = {
  // Validate coupon without applying it
  async validateCoupon(request: ApplyCouponRequest): Promise<CouponValidationResult> {
    try {
      const response = await apiClient.post('/api/coupons/validate', request);
      return response.data;
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      return {
        isValid: false,
        error: error.response?.data?.message || 'Failed to validate coupon'
      };
    }
  },

  // Apply coupon and get discount details
  async applyCoupon(request: ApplyCouponRequest): Promise<OrderDiscount> {
    try {
      const response = await apiClient.post('/api/coupons/apply', request);
      return response.data;
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      throw new Error(error.response?.data?.message || 'Failed to apply coupon');
    }
  },

  // Get available coupons for user
  async getUserCoupons(): Promise<Coupon[]> {
    try {
      const response = await apiClient.get('/api/coupons/user');
      return response.data.items || response.data;
    } catch (error: any) {
      console.error('Error fetching user coupons:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch coupons');
    }
  },

  // Admin: Get all coupons
  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const response = await apiClient.get('/api/admin/coupons');
      return response.data.items || response.data;
    } catch (error: any) {
      console.error('Error fetching all coupons:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch coupons');
    }
  },

  // Admin: Get coupon by ID
  async getCouponById(id: string): Promise<Coupon> {
    try {
      const response = await apiClient.get(`/api/admin/coupons/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching coupon:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch coupon');
    }
  },

  // Admin: Create new coupon
  async createCoupon(coupon: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
    try {
      const response = await apiClient.post('/api/admin/coupons', coupon);
      return response.data;
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      throw new Error(error.response?.data?.message || 'Failed to create coupon');
    }
  },

  // Admin: Update coupon
  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    try {
      const response = await apiClient.patch(`/api/admin/coupons/${id}`, updates);
      return response.data;
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      throw new Error(error.response?.data?.message || 'Failed to update coupon');
    }
  },

  // Admin: Delete coupon
  async deleteCoupon(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/admin/coupons/${id}`);
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete coupon');
    }
  },

  // Admin: Get coupon usage statistics
  async getCouponStats(): Promise<CouponUsageStats> {
    try {
      const response = await apiClient.get('/api/admin/coupons/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching coupon stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch coupon statistics');
    }
  },

  // Calculate discount amount locally
  calculateDiscount(coupon: Coupon, orderTotal: number, items?: any[]): number {
    if (!coupon.isActive || this.isCouponExpired(coupon)) {
      return 0;
    }

    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return 0;
    }

    let discount = 0;

    switch (coupon.type) {
      case 'percentage':
        discount = (orderTotal * coupon.value) / 100;
        break;
      case 'fixed':
        discount = coupon.value;
        break;
      case 'shipping':
        // For shipping discounts, this would need shipping cost calculation
        discount = coupon.value;
        break;
      default:
        discount = 0;
    }

    // Apply maximum discount limit
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    // Ensure discount doesn't exceed order total
    return Math.min(discount, orderTotal);
  },

  // Check if coupon is expired
  isCouponExpired(coupon: Coupon): boolean {
    const now = new Date();
    const endDate = new Date(coupon.endDate);
    const startDate = new Date(coupon.startDate);
    
    return now > endDate || now < startDate;
  },

  // Check if user can use this coupon
  async canUserUseCoupon(coupon: Coupon, userId?: string): Promise<boolean> {
    if (!coupon.isActive || this.isCouponExpired(coupon)) {
      return false;
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return false;
    }

    if (userId && coupon.userLimit) {
      try {
        const response = await apiClient.get(`/api/coupons/${coupon.id}/user-usage/${userId}`);
        const userUsageCount = response.data.usageCount || 0;
        return userUsageCount < coupon.userLimit;
      } catch (error) {
        console.error('Error checking user coupon usage:', error);
        return false;
      }
    }

    return true;
  }
};

export default couponService;