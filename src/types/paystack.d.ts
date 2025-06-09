interface PaystackPopup {
  setup(options: {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    ref?: string;
    metadata?: Record<string, any>;
    callback?: (response: PaystackResponse) => void;
    onClose?: () => void;
  }): {
    openIframe(): void;
  };
}

interface PaystackResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

interface Window {
  PaystackPop: PaystackPopup;
}

export type { PaystackPopup, PaystackResponse };
