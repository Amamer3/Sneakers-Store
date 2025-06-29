import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Coins, DollarSign, CircleDollarSign } from 'lucide-react';
import { useCurrency, type Currency } from '@/context/CurrencyContext';

const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency, isLoading, error } = useCurrency();

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'GHS', label: 'Ghanaian Cedi', symbol: '₵' },
    { value: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
  ];

  // Choose icon based on selected currency
  const getCurrencyIcon = () => {
    if (currency === 'USD') return <DollarSign className="h-4 w-4" />;
    if (currency === 'GHS') return <CircleDollarSign className="h-4 w-4" />;
    if (currency === 'AED') return <span className="h-4 w-4 text-lg">د.إ</span>;
    return <Coins className="h-4 w-4" />;
  };

  return (
    <div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 px-0"
            aria-label="Select currency"
            disabled={isLoading}
          >
            {getCurrencyIcon()}
            <span className="sr-only">Select currency</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currencies.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onSelect={() => setCurrency(c.value)}
              className={`flex items-center ${currency === c.value ? 'bg-accent' : ''}`}
              aria-selected={currency === c.value}
            >
              <span className="w-4 h-4 mr-2" aria-hidden="true">
                {c.symbol}
              </span>
              {c.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CurrencySwitcher;