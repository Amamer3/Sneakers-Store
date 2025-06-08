export interface ExchangeRates {
  USD: number;
  GHS: number;
  timestamp: number;
}

// Fixed exchange rates (1 USD = 11.50 GHS as of 2025)
export const DEFAULT_RATES: ExchangeRates = {
  GHS: 1, // Base currency
  USD: 1/11.50, // Conversion rate from GHS to USD
  timestamp: Date.now()
};

export const currencyService = {
  getExchangeRates(): ExchangeRates {
    // Always return the fixed rates
    return DEFAULT_RATES;
  },

  /**
   * Convert amount from one currency to another
   * @param amount The amount to convert
   * @param fromCurrency The currency to convert from ('USD' | 'GHS')
   * @param toCurrency The currency to convert to ('USD' | 'GHS')
   */  convert(amount: number, fromCurrency: 'USD' | 'GHS', toCurrency: 'USD' | 'GHS'): number {
    // Since we store everything in GHS, and GHS is our base currency:
    const rates = DEFAULT_RATES;
    
    // If we're already in GHS and want GHS, return as is
    if (toCurrency === 'GHS') {
      return amount;
    }
    
    // Converting from GHS to USD
    if (toCurrency === 'USD') {
      // Convert by multiplying with the USD rate (which is 1/11.50)
      return Math.round((amount * rates.USD) * 100) / 100;
    }
    
    return amount;
  },

  /**
   * Format price in the given currency
   * @param amount The amount to format
   * @param currency The currency to format in ('USD' | 'GHS')
   */  formatPrice(amount: number, currency: 'USD' | 'GHS'): string {
    // For GHS (Ghana Cedis), use GHS code and proper locale
    const formatter = new Intl.NumberFormat(currency === 'GHS' ? 'en-GH' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'symbol'
    });
    
    const formatted = formatter.format(amount);
    
    // For GHS, replace GHS with ₵ if needed (some browsers might not support the Cedi symbol)
    if (currency === 'GHS' && formatted.includes('GHS')) {
      return formatted.replace('GHS', '₵');
    }
    
    return formatted;
  }
};
