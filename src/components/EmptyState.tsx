import React from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: 'products' | 'loading';
  onRetry?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Products Found",
  message = "We're working on adding new products to our collection. Please check back soon!",
  icon = 'products',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        {icon === 'products' ? (
          <Package className="w-8 h-8 text-gray-400" />
        ) : (
          <RefreshCw className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default EmptyState;