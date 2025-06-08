import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyService } from '@/services/currency-service';

export type Currency = 'USD' | 'GHS';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number) => string;
  convertPrice: (amount: number) => number;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferred-currency');
    return (saved as Currency) || 'GHS';
  });

  // Save currency preference
  useEffect(() => {
    localStorage.setItem('preferred-currency', currency);
  }, [currency]);

  const formatPrice = (amount: number): string => {
    return currencyService.formatPrice(amount, currency);
  };

  const convertPrice = (amount: number): number => {
    // Convert from USD to current currency
    return currency === 'USD' ? amount : currencyService.convert(amount, 'USD', 'GHS');
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    formatPrice,
    convertPrice,
    isLoading: false // Always false since we're not making API calls
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};