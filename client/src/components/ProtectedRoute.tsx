import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        data-testid="loading-state"
        className="flex items-center justify-center min-h-[60vh] text-stone-600"
      >
        <div className="animate-pulse font-medium">Loading session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath =
      user.role === 'OPERATOR' ? '/operator/orders' : '/catalog';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
