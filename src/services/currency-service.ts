export interface ExchangeRates {
  USD: number;
  GHS: number;
  timestamp: number;
}

// Fixed exchange rates
const DEFAULT_RATES: ExchangeRates = {
  USD: 1,
  GHS: 11.85, // Updated GHS to USD rate as of June 2025
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
   */
  convert(amount: number, fromCurrency: 'USD' | 'GHS', toCurrency: 'USD' | 'GHS'): number {
    if (fromCurrency === toCurrency) return amount;
    
    const rates = DEFAULT_RATES;
    if (fromCurrency === 'USD' && toCurrency === 'GHS') {
      return amount * rates.GHS;
    } else if (fromCurrency === 'GHS' && toCurrency === 'USD') {
      return amount / rates.GHS;
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
