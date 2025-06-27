import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, WifiOffIcon, SettingsIcon } from 'lucide-react';

interface FallbackBannerProps {
  isVisible: boolean;
  message?: string;
  type?: 'demo' | 'offline' | 'maintenance';
  className?: string;
}

const FallbackBanner: React.FC<FallbackBannerProps> = ({ 
  isVisible, 
  message = 'Running in demo mode while backend is being deployed',
  type = 'demo',
  className = ''
}) => {
  if (!isVisible) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'offline': 
        return <WifiOffIcon className="h-4 w-4" />;
      case 'maintenance': 
        return <SettingsIcon className="h-4 w-4" />;
      default: 
        return <InfoIcon className="h-4 w-4" />;
    }
  };
  
  const getTitle = () => {
    switch (type) {
      case 'offline': 
        return 'Offline Mode';
      case 'maintenance': 
        return 'Maintenance Mode';
      default: 
        return 'Demo Mode Active';
    }
  };
  
  const getVariant = (): 'default' | 'destructive' => {
    switch (type) {
      case 'offline': 
        return 'destructive';
      default: 
        return 'default';
    }
  };
  
  return (
    <Alert variant={getVariant()} className={`mb-4 ${className}`}>
      {getIcon()}
      <AlertTitle className="flex items-center gap-2">
        {getTitle()}
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Backend Deploying
        </span>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{message}</p>
          <div className="text-sm text-muted-foreground">
            <p>• You can explore the interface with demo data</p>
            <p>• Full functionality will be restored automatically</p>
            <p>• No action required from your side</p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default FallbackBanner;