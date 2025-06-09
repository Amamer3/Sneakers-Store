import apiClient from '@/lib/api-client';
import type { PaystackPopup, PaystackResponse } from '@/types/paystack';

declare global {
  interface Window {
    PaystackPop: PaystackPopup;
  }
}

export interface PaymentInitialization {
  reference: string;
  orderId: string;
}

export interface PaymentVerification {
  status: string;
  reference: string;
  orderId: string;
  amount: number;
  currency: string;
  metadata?: {
    orderId?: string;
    customerId?: string;
  };
}

export interface InitializePaymentData {
  /**
   * Amount in Ghana Cedis (GHS).
   * Example: For 100 Ghana Cedis, pass 100.00
   */
  amount: number;
  email: string;
  orderId: string;
  customerId: string;
  metadata?: Record<string, unknown>;
}

type PaymentService = {
  logPaymentData: (data: InitializePaymentData) => void;
  initializePayment: (data: InitializePaymentData) => Promise<PaymentInitialization>;
  verifyPayment: (reference: string) => Promise<PaymentVerification>;
  isPaystackLoaded: () => boolean;
  clearPaymentData: () => void;
  getStoredPaymentData: () => { reference: string | null; orderId: string | null };
};

export const paymentService: PaymentService = {
  logPaymentData: (data: InitializePaymentData): void => {
    console.log('[PaymentService] Initializing payment:', {
      amount: data.amount,
      email: data.email,
      orderId: data.orderId,
      customerId: data.customerId,
      metadata: data.metadata
    });
  },

  initializePayment: (data: InitializePaymentData): Promise<PaymentInitialization> => {
    if (!data.amount || !data.orderId || !data.email) {
      return Promise.reject(new Error('Amount, orderId, and email are required'));
    }

    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      return Promise.reject(new Error('Paystack public key is not configured'));
    }

    const amountInPesewas = Math.round(data.amount * 100);
    const reference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise<PaymentInitialization>((resolve, reject) => {
      if (!window.PaystackPop) {
        reject(new Error('Paystack is not loaded'));
        return;
      }

      try {        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: data.email,
          amount: amountInPesewas,
          currency: 'GHS',
          ref: reference,
          metadata: {
            orderId: data.orderId,
            customerId: data.customerId,
            ...data.metadata
          },
          onClose: function() {
            reject(new Error('Payment cancelled by user'));
          },
          callback: function(response) {
            if (response.status === 'success') {
              paymentService.verifyPayment(response.reference)
                .then(() => {
                  localStorage.setItem('paymentReference', response.reference);
                  localStorage.setItem('orderId', data.orderId);
                  resolve({ reference: response.reference, orderId: data.orderId });
                })
                .catch((error) => {
                  reject(error instanceof Error ? error : new Error('Payment verification failed'));
                });
            } else {
              reject(new Error('Payment was not successful'));
            }
          }
        });

        handler.openIframe();
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to initialize payment'));
      }
    });
  },

  verifyPayment: async (reference: string): Promise<PaymentVerification> => {
    if (!reference) {
      throw new Error('Payment reference is required');
    }

    try {
      const response = await apiClient.get<PaymentVerification>(`/payment/verify/${reference}`);
      console.log('[PaymentService] Payment verified:', response.data);
      return response.data;
    } catch (error) {
      console.error('[PaymentService] Payment verification error:', error);
      throw error instanceof Error ? error : new Error('Payment verification failed');
    }
  },

  isPaystackLoaded: (): boolean => {
    return typeof window !== 'undefined' && 'PaystackPop' in window;
  },
  clearPaymentData: (): void => {
    localStorage.removeItem('paymentReference');
    localStorage.removeItem('orderId');
  },

  getStoredPaymentData: (): { reference: string | null; orderId: string | null } => {
    return {
      reference: localStorage.getItem('paymentReference'),
      orderId: localStorage.getItem('orderId')
    };
  }
};
