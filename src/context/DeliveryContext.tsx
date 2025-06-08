import React, { createContext, useContext, useState, useEffect } from 'react';
import { deliveryService, type DeliveryZone, type ValidationResult, type DeliveryAddress } from '@/services/delivery-service';
import { useToast } from '@/hooks/use-toast';

interface DeliveryContextType {
  currentZone: DeliveryZone | null;
  isLoading: boolean;
  error: string | null;
  validateAddress: (address: DeliveryAddress) => Promise<ValidationResult>;
  allowsCashOnDelivery: boolean;
}

const defaultDeliveryZone: DeliveryZone = {
  id: 'default',
  name: 'Standard Delivery',
  description: '3-5 business days',
  price: 5.99,
  estimatedDays: 5,
  allowsCashOnDelivery: true
};

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentZone, setCurrentZone] = useState<DeliveryZone | null>(defaultDeliveryZone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    const loadDeliveryOptions = async () => {
      if (!mounted) return;
      
      try {
        setIsLoading(true);
        setError(null);

        const options = await deliveryService.getDeliveryOptions();
        
        if (!mounted) return;

        if (options?.zones?.length > 0) {
          const zone = options.zones.find(z => z.id === options.defaultZone) || options.zones[0];
          setCurrentZone(zone);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Delivery options error:', err);
        // Keep using default zone
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadDeliveryOptions();
    
    return () => {
      mounted = false;
    };
  }, []);

  const validateAddress = async (address: DeliveryAddress): Promise<ValidationResult> => {
    try {
      const result = await deliveryService.validateAddress(address);
      if (result.zoneId) {
        try {
          const options = await deliveryService.getDeliveryOptions();
          const newZone = options?.zones?.find(z => z.id === result.zoneId) || defaultDeliveryZone;
          setCurrentZone(newZone);
        } catch (error) {
          console.error('Failed to get delivery options after validation:', error);
        }
      }
      return result;
    } catch (err) {
      const errorMessage = 'Failed to validate delivery address';
      setError(errorMessage);
      throw err;
    }
  };

  return (
    <DeliveryContext.Provider
      value={{
        currentZone,
        isLoading,
        error,
        validateAddress,
        allowsCashOnDelivery: currentZone?.allowsCashOnDelivery ?? defaultDeliveryZone.allowsCashOnDelivery
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};
