import apiClient from '@/lib/api-client';

export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  label?: string; // e.g., 'Home', 'Work', etc.
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export const profileService = {
  async getProfile(): Promise<Profile> {
    const response = await apiClient.get<Profile>('/users/me');
    return response.data;
  },

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    const response = await apiClient.put<Profile>('/users/me', data);
    return response.data;
  },

  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get<Address[]>('/users/me/addresses');
    return response.data;
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const response = await apiClient.post<Address>('/users/me/addresses', address);
    return response.data;
  },

  async updateAddress(addressId: string, address: Partial<Address>): Promise<Address> {
    const response = await apiClient.put<Address>(`/users/me/addresses/${addressId}`, address);
    return response.data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    await apiClient.delete(`/users/me/addresses/${addressId}`);
  }
};
