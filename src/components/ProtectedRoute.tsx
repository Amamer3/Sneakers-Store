import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from './ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const currentLocation = window.location.pathname + window.location.search;

  useEffect(() => {
    // Log auth state for debugging
    console.debug('ProtectedRoute auth state:', {
      isAuthenticated,
      isLoading,
      hasCustomer: false, // Replace with appropriate logic if needed
      isAdmin,
      currentLocation
    });
  }, [isAuthenticated, isLoading, isAdmin, currentLocation]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="space-y-4 w-[80%] max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.debug('Redirecting to login, not authenticated');
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentLocation)}`} replace />;
  }

  // Redirect to home if trying to access admin route without admin rights
  if (adminOnly && !isAdmin) {
    console.debug('Redirecting to home, not admin');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
