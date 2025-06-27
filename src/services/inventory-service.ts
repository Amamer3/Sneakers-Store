import apiClient from '@/lib/api-client';
import { InventoryReservation } from '@/types/order';

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  size?: string;
  color?: string;
  quantity: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  maxStock: number;
  location?: string;
  lastUpdated: string | Date;
}

export interface StockCheck {
  productId: string;
  size?: string;
  requestedQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  reservationId?: string;
}

export interface BulkStockCheck {
  items: Array<{
    productId: string;
    size?: string;
    quantity: number;
  }>;
  results: StockCheck[];
  allAvailable: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  sku: string;
  type: 'in' | 'out' | 'adjustment' | 'reserved' | 'released';
  quantity: number;
  reason: string;
  reference?: string;
  performedBy: string;
  timestamp: string | Date;
  metadata?: Record<string, any>;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  suggestedReorder: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string | Date;
}

interface InventoryServiceInterface {
  // Stock checking
  checkStock(productId: string, size?: string, quantity?: number): Promise<StockCheck>;
  bulkCheckStock(items: Array<{ productId: string; size?: string; quantity: number }>): Promise<BulkStockCheck>;
  getInventoryItem(productId: string, size?: string): Promise<InventoryItem>;
  
  // Reservations
  reserveStock(productId: string, quantity: number, size?: string, expirationMinutes?: number): Promise<InventoryReservation>;
  releaseReservation(reservationId: string): Promise<void>;
  confirmReservation(reservationId: string): Promise<void>;
  extendReservation(reservationId: string, additionalMinutes: number): Promise<InventoryReservation>;
  getUserReservations(): Promise<InventoryReservation[]>;
  
  // Admin stock management
  updateStock(productId: string, size: string | undefined, quantity: number, reason: string): Promise<InventoryItem>;
  adjustStock(productId: string, size: string | undefined, adjustment: number, reason: string): Promise<InventoryItem>;
  getStockMovements(productId?: string, limit?: number): Promise<StockMovement[]>;
  
  // Alerts and monitoring
  getLowStockAlerts(): Promise<LowStockAlert[]>;
  getStockSummary(): Promise<{
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
  }>;
  
  // Utility methods
  isStockAvailable(productId: string, size: string | undefined, quantity: number): Promise<boolean>;
  getEstimatedRestockDate(productId: string, size?: string): Promise<string | null>;
}

export const inventoryService: InventoryServiceInterface = {
  // Check stock availability for a single item
  async checkStock(productId: string, size?: string, quantity: number = 1): Promise<StockCheck> {
    try {
      const params = new URLSearchParams({
        productId,
        quantity: quantity.toString(),
        ...(size && { size })
      });
      
      const response = await apiClient.get(`/inventory/check?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking stock:', error);
      throw new Error(error.response?.data?.message || 'Failed to check stock availability');
    }
  },

  // Check stock for multiple items at once
  async bulkCheckStock(items: Array<{ productId: string; size?: string; quantity: number }>): Promise<BulkStockCheck> {
    try {
      const response = await apiClient.post('/inventory/bulk-check', { items });
      return response.data;
    } catch (error: any) {
      console.error('Error checking bulk stock:', error);
      throw new Error(error.response?.data?.message || 'Failed to check stock availability');
    }
  },

  // Get detailed inventory information for a product
  async getInventoryItem(productId: string, size?: string): Promise<InventoryItem> {
    try {
      const params = size ? `?size=${encodeURIComponent(size)}` : '';
      const response = await apiClient.get(`/inventory/products/${productId}${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching inventory item:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch inventory information');
    }
  },

  // Reserve stock for a limited time (default 30 minutes)
  async reserveStock(
    productId: string, 
    quantity: number, 
    size?: string, 
    expirationMinutes: number = 30
  ): Promise<InventoryReservation> {
    try {
      const response = await apiClient.post('/inventory/reserve', {
        productId,
        quantity,
        size,
        expirationMinutes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error reserving stock:', error);
      throw new Error(error.response?.data?.message || 'Failed to reserve stock');
    }
  },

  // Release a stock reservation
  async releaseReservation(reservationId: string): Promise<void> {
    try {
      await apiClient.delete(`/inventory/reservations/${reservationId}`);
    } catch (error: any) {
      console.error('Error releasing reservation:', error);
      throw new Error(error.response?.data?.message || 'Failed to release reservation');
    }
  },

  // Confirm a reservation (convert to actual stock reduction)
  async confirmReservation(reservationId: string): Promise<void> {
    try {
      await apiClient.post(`/inventory/reservations/${reservationId}/confirm`);
    } catch (error: any) {
      console.error('Error confirming reservation:', error);
      throw new Error(error.response?.data?.message || 'Failed to confirm reservation');
    }
  },

  // Extend reservation expiration time
  async extendReservation(reservationId: string, additionalMinutes: number): Promise<InventoryReservation> {
    try {
      const response = await apiClient.patch(`/inventory/reservations/${reservationId}/extend`, {
        additionalMinutes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error extending reservation:', error);
      throw new Error(error.response?.data?.message || 'Failed to extend reservation');
    }
  },

  // Get user's active reservations
  async getUserReservations(): Promise<InventoryReservation[]> {
    try {
      const response = await apiClient.get('/inventory/reservations/my');
      return response.data.items || response.data;
    } catch (error: any) {
      console.error('Error fetching user reservations:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch reservations');
    }
  },

  // Admin: Update stock quantity
  async updateStock(productId: string, size: string | undefined, quantity: number, reason: string): Promise<InventoryItem> {
    try {
      const response = await apiClient.put(`/admin/inventory/products/${productId}/stock`, {
        size,
        quantity,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating stock:', error);
      throw new Error(error.response?.data?.message || 'Failed to update stock');
    }
  },

  // Admin: Adjust stock (add or subtract)
  async adjustStock(productId: string, size: string | undefined, adjustment: number, reason: string): Promise<InventoryItem> {
    try {
      const response = await apiClient.patch(`/admin/inventory/products/${productId}/adjust`, {
        size,
        adjustment,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      throw new Error(error.response?.data?.message || 'Failed to adjust stock');
    }
  },

  // Get stock movement history
  async getStockMovements(productId?: string, limit: number = 50): Promise<StockMovement[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(productId && { productId })
      });
      
      const response = await apiClient.get(`/admin/inventory/movements?${params}`);
      return response.data.items || response.data;
    } catch (error: any) {
      console.error('Error fetching stock movements:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch stock movements');
    }
  },

  // Get low stock alerts
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    try {
      const response = await apiClient.get('/admin/inventory/alerts/low-stock');
      return response.data.items || response.data;
    } catch (error: any) {
      console.error('Error fetching low stock alerts:', error);
      
      // Handle 404 errors with fallback data for demo mode
      if (error.response?.status === 404) {
        console.warn('Backend not available, using demo data for low stock alerts');
        return [
          {
            id: 'alert-1',
            productId: 'prod-1',
            sku: 'AIR-MAX-90-001',
            currentStock: 2,
            reorderLevel: 10,
            suggestedReorder: 50,
            priority: 'high' as const,
            createdAt: new Date().toISOString()
          },
          {
            id: 'alert-2',
            productId: 'prod-2',
            sku: 'JORDAN-1-002',
            currentStock: 1,
            reorderLevel: 5,
            suggestedReorder: 25,
            priority: 'critical' as const,
            createdAt: new Date().toISOString()
          },
          {
            id: 'alert-3',
            productId: 'prod-3',
            sku: 'YEEZY-350-003',
            currentStock: 3,
            reorderLevel: 8,
            suggestedReorder: 30,
            priority: 'medium' as const,
            createdAt: new Date().toISOString()
          }
        ];
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch low stock alerts');
    }
  },

  // Get inventory summary statistics
  async getStockSummary(): Promise<{
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
  }> {
    try {
      const response = await apiClient.get('/admin/inventory/summary');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching stock summary:', error);
      
      // Handle 404 errors with fallback data for demo mode
      if (error.response?.status === 404) {
        console.warn('Backend not available, using demo data for inventory summary');
        return {
          totalProducts: 156,
          lowStockItems: 12,
          outOfStockItems: 3,
          totalValue: 89750.50
        };
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch stock summary');
    }
  },

  // Utility: Quick stock availability check
  async isStockAvailable(productId: string, size: string | undefined, quantity: number): Promise<boolean> {
    try {
      const stockCheck = await this.checkStock(productId, size, quantity);
      return stockCheck.isAvailable;
    } catch (error) {
      console.error('Error checking stock availability:', error);
      return false;
    }
  },

  // Get estimated restock date
  async getEstimatedRestockDate(productId: string, size?: string): Promise<string | null> {
    try {
      const params = size ? `?size=${encodeURIComponent(size)}` : '';
      const response = await apiClient.get(`/inventory/products/${productId}/restock-estimate${params}`);
      return response.data.estimatedDate || null;
    } catch (error: any) {
      console.error('Error fetching restock estimate:', error);
      return null;
    }
  }
};

export default inventoryService;