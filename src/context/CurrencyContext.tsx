import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyService } from '@/services/currency-service';
import { DEFAULT_RATES } from '@/services/currency-service';

export type Currency = 'USD' | 'GHS';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number) => string;
  convertPrice: (amount: number, fromCurrency: Currency) => number;
  isLoading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferred-currency');
    return saved && ['USD', 'GHS'].includes(saved) ? (saved as Currency) : 'GHS';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('preferred-currency', currency);
  }, [currency]);

  const formatPrice = (amount: number): string => {
    try {
      if (isNaN(amount)) {
        console.warn('Invalid amount for formatting:', amount);
        return 'N/A';
      }
      // Since amount is always in GHS, convert to USD if needed
      const finalAmount = currency === 'USD' ? currencyService.convert(amount, 'GHS', 'USD') : amount;
      return currencyService.formatPrice(finalAmount, currency);
    } catch (err) {
      console.error('Error formatting price:', err);
      setError('Failed to format price');
      return 'N/A';
    }
  };

  const convertPrice = (amount: number, fromCurrency: Currency): number => {
    try {
      if (isNaN(amount)) {
        console.warn('Invalid amount for conversion:', amount);
        return 0;
      }
      // If the amount is coming from USD, convert it to our base currency (GHS)
      if (fromCurrency === 'USD') {
        const amountInGHS = amount * (1 / DEFAULT_RATES.USD);
        return Math.round(amountInGHS * 100) / 100;
      }
      return amount;
    } catch (err) {
      console.error('Error converting price:', err);
      setError('Failed to convert price');
      return 0;
    }
  };

  const value = React.useMemo(
    () => ({
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
      isLoading,
      error,
    }),
    [currency, isLoading, error]
  );

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