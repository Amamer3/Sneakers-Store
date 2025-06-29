import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyService } from '@/services/currency-service';
import { DEFAULT_RATES } from '@/services/currency-service';

export type Currency = 'USD' | 'GHS' | 'AED';

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
    return saved && ['USD', 'GHS', 'AED'].includes(saved) ? (saved as Currency) : 'GHS';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('preferred-currency', currency);
  }, [currency]);

  const formatPrice = (amount: number): string => {
    try {
      if (isNaN(amount) || amount === undefined || amount === null) {
        console.warn('Invalid amount for formatting:', amount);
        // Return formatted zero instead of N/A
        return currencyService.formatPrice(0, currency);
      }
      if (amount < 0) {
        // Optionally handle negative values differently if needed
        return '-' + currencyService.formatPrice(Math.abs(amount), currency);
      }
      // Since amount is always in GHS, convert to USD or AED if needed
      let finalAmount = amount;
      if (currency === 'USD') {
        finalAmount = currencyService.convert(amount, 'GHS', 'USD');
      } else if (currency === 'AED') {
        finalAmount = currencyService.convert(amount, 'GHS', 'AED');
      }
      return currencyService.formatPrice(finalAmount, currency);
    } catch (err) {
      console.error('Error formatting price:', err);
      setError('Failed to format price');
      // Return formatted zero instead of N/A
      return currencyService.formatPrice(0, currency);
    }
  };

  const convertPrice = (amount: number, fromCurrency: Currency): number => {
    try {
      if (isNaN(amount)) {
        console.warn('Invalid amount for conversion:', amount);
        return 0;
      }
      // If the amount is coming from USD or AED, convert it to our base currency (GHS)
      if (fromCurrency === 'USD') {
        const amountInGHS = amount * (1 / DEFAULT_RATES.USD);
        return Math.round(amountInGHS * 100) / 100;
      } else if (fromCurrency === 'AED') {
        const amountInGHS = amount * (1 / DEFAULT_RATES.AED);
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