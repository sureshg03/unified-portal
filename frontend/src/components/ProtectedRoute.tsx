import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin, isLSCUser } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireUser?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireUser = false
}) => {
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/lsc/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/lsc/login" replace />;
  }

  // Check user requirement
  if (requireUser && !isLSCUser()) {
    return <Navigate to="/lsc/login" replace />;
  }

  return <>{children}</>;
};