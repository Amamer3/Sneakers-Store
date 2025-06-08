import apiClient from '@/lib/api-client';

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  allowsCashOnDelivery: boolean;
  country?: string;
  region?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  zoneId?: string;
  suggestedAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

interface DeliveryOptions {
  zones: DeliveryZone[];
  defaultZone?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export const deliveryService = {
  async getDeliveryOptions(): Promise<DeliveryOptions> {
    try {
      const response = await apiClient.get<DeliveryOptions>('/api/delivery/delivery-options');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching delivery options:', error);
      throw new Error('Failed to load delivery options. Please try again later.');
    }
  },

  async validateAddress(address: DeliveryAddress): Promise<ValidationResult> {
    try {
      const response = await apiClient.post<ValidationResult>(
        '/api/delivery/validate-delivery-address',
        address
      );
      return response.data;
    } catch (error: any) {
      console.error('Error validating address:', error);
      if (error.response?.status === 401) {
        throw new Error('Please log in to validate delivery address');
      }
      throw new Error('Failed to validate delivery address. Please try again later.');
    }
  }
};
