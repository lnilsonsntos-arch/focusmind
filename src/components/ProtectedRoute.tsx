import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isInitializing } = useAuth();
  const location = useLocation();

  // Show loading spinner during initialization phase
  // This is critical - we must wait for the auth state to be determined
  // before making any routing decisions
  if (isInitializing || (loading && !user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // After initialization, if no user exists, redirect to login
  // Save the attempted URL for redirect after login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
