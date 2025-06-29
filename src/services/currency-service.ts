export interface ExchangeRates {
  USD: number;
  GHS: number;
  AED: number;
  timestamp: number;
}

// Fixed exchange rates (1 USD = 11.50 GHS, 1 AED = 3.13 GHS as of 2025)
export const DEFAULT_RATES: ExchangeRates = {
  GHS: 1, // Base currency
  USD: 1/11.50, // Conversion rate from GHS to USD
  AED: 1/3.13, // Conversion rate from GHS to AED
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
   * @param fromCurrency The currency to convert from ('USD' | 'GHS' | 'AED')
   * @param toCurrency The currency to convert to ('USD' | 'GHS' | 'AED')
   */
  convert(amount: number, fromCurrency: 'USD' | 'GHS' | 'AED', toCurrency: 'USD' | 'GHS' | 'AED'): number {
    const rates = DEFAULT_RATES;
    if (fromCurrency === toCurrency) return amount;
    // Convert from any to GHS first
    let amountInGHS = amount;
    if (fromCurrency !== 'GHS') {
      amountInGHS = fromCurrency === 'USD'
        ? amount / rates.USD
        : amount / rates.AED;
    }
    // Then from GHS to target
    if (toCurrency === 'GHS') return amountInGHS;
    if (toCurrency === 'USD') return Math.round((amountInGHS * rates.USD) * 100) / 100;
    if (toCurrency === 'AED') return Math.round((amountInGHS * rates.AED) * 100) / 100;
    return amount;
  },

  /**
   * Format price in the given currency
   * @param amount The amount to format
   * @param currency The currency to format in ('USD' | 'GHS' | 'AED')
   */
  formatPrice(amount: number, currency: 'USD' | 'GHS' | 'AED'): string {
    const locale = currency === 'GHS' ? 'en-GH' : currency === 'AED' ? 'en-AE' : 'en-US';
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'symbol'
    });
    let formatted = formatter.format(amount);
    if (currency === 'GHS' && formatted.includes('GHS')) {
      formatted = formatted.replace('GHS', '₵');
    }
    return formatted;
  }
};
