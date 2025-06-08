import PaystackPop from '@paystack/inline-js';
import apiClient from '@/lib/api-client';

export interface PaymentInitialization {
  reference: string;
  authorization_url?: string;
  access_code?: string;
  amount: number;
  email: string;
  status: string;
}

export interface PaymentVerification {
  status: string;
  reference: string;
  orderId: string;
  amount: number;
  transaction_date?: string;
  currency?: string;
}

// Make sure this matches your environment variable name
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

interface PaystackResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref?: string;
}

interface PaystackTransaction {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  transaction_date: string;
  customer: {
    email: string;
    metadata?: any;
  };
  metadata: {
    orderId: string;
  };
}

export const paymentService = {
  async initializePayment(orderId: string, amount: number, email: string): Promise<PaymentInitialization> {
    if (!orderId || !amount || !email) {
      throw new Error('Amount, orderId, and email are required');
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      throw new Error('Paystack public key is not configured');
    }

    try {
      // Ensure amount is positive and convert to kobo (smallest currency unit)
      const amountInKobo = Math.round(Math.abs(amount) * 100);
      
      // First, initialize the payment on our backend to get a reference
      const response = await apiClient.post('/payment/initialize', {
        orderId,
        amount: amountInKobo,
        email: email.trim(),
        metadata: {
          orderId,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "orderId",
              value: orderId
            }
          ]
        },
        currency: "GHS" // Ghanaian Cedis
      });

      if (!response.data || !response.data.reference) {
        throw new Error('Invalid response from payment initialization');
      }

      // Initialize Paystack inline popup
      return new Promise((resolve, reject) => {
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: PAYSTACK_PUBLIC_KEY,
          email: email.trim(),
          amount: amountInKobo,
          ref: response.data.reference,
          currency: "GHS",
          metadata: {
            orderId,
            custom_fields: [
              {
                display_name: "Order ID",
                variable_name: "orderId",
                value: orderId
              }
            ]
          },
          onSuccess: (transaction: PaystackResponse) => {
            resolve({
              reference: transaction.reference || transaction.trxref || '',
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
      // Verify payment with our backend which will in turn verify with Paystack
      const response = await apiClient.get<PaystackTransaction>(`/payment/verify/${reference}`);
      
      if (!response.data) {
        throw new Error('Invalid response from payment verification');
      }

      return {
        status: response.data.status,
        reference: response.data.reference,
        orderId: response.data.metadata.orderId,
        amount: response.data.amount / 100, // Convert from kobo back to cedis
        transaction_date: response.data.transaction_date,
        currency: response.data.currency
      };
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  },

  async retryVerification(reference: string): Promise<PaymentVerification> {
    try {
      // Implement retry logic with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount < maxRetries) {
        try {
          const verification = await this.verifyPayment(reference);
          return verification;
        } catch (error: any) {
          lastError = error;
          retryCount++;
          if (retryCount < maxRetries) {
            // Wait for exponentially longer times between retries (1s, 2s, 4s)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000));
          }
        }
      }

      throw lastError || new Error('Failed to verify payment after multiple attempts');
    } catch (error: any) {
      console.error('Error in retry verification:', error);
      throw new Error(error.message || 'Failed to verify payment');
    }
  }
};
