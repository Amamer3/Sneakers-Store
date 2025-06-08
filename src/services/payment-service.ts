import PaystackPop from '@paystack/inline-js';
import apiClient from '@/lib/api-client';

export interface PaymentInitialization {
  reference: string;
  accessCode: string;
  amount: number;
  email: string;
  status: string;
}

export interface PaymentVerification {
  status: string;
  reference: string;
  orderId: string;
  amount: number;
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_API_URL_APP_PAYSTACK_PUBLIC_KEY;

interface PaystackResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
}

export const paymentService = {
  async initializePayment(orderId: string, amount: number, email: string): Promise<PaymentInitialization> {
    try {
      // First, initialize the payment on our backend
      const response = await apiClient.post('/payment/initialize', {
        orderId,
        amount: amount * 100, // Convert to kobo
        email
      });

      if (!response.data || !response.data.reference) {
        throw new Error('Invalid response from payment initialization');
      }

      // Initialize Paystack popup
      return new Promise((resolve, reject) => {
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: PAYSTACK_PUBLIC_KEY,
          email,
          amount: amount * 100, // Amount in kobo
          ref: response.data.reference,
          onSuccess: (transaction: PaystackResponse) => {
            // Verify the payment
            resolve({
              reference: transaction.reference,
              accessCode: transaction.trans,
              amount: amount,
              email,
              status: 'success'
            });
          },
          onCancel: () => {
            reject(new Error('Payment cancelled by user'));
          }
        });
      });
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
  },

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    try {
      // Verify payment with our backend
      const response = await apiClient.get(`/payment/verify/${reference}`);
      
      if (!response.data) {
        throw new Error('Invalid response from payment verification');
      }

      return {
        status: response.data.status,
        reference: response.data.reference,
        orderId: response.data.orderId,
        amount: response.data.amount
      };
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  },

  async retryVerification(reference: string): Promise<PaymentVerification> {
    try {
      // Add a delay before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.verifyPayment(reference);
    } catch (error) {
      console.error('Error in retry verification:', error);
      throw error;
    }
  }
};
