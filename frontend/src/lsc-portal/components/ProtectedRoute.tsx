import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, isLSCUser, getUserInfo } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireUser?: boolean;
}

/**
 * Protected Route Component
 * Handles authentication and role-based authorization
 */
export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireUser = false 
}: ProtectedRouteProps) => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/lsc/login" replace />;
  }

  const userInfo = getUserInfo();

  // Check admin access
  if (requireAdmin && !isAdmin()) {
    // If admin access required but user is not admin, redirect to user dashboard
    return <Navigate to="/lsc/dashboard/user" replace />;
  }

  // Check user access
  if (requireUser && !isLSCUser()) {
    // If user access required but user is admin, redirect to admin dashboard
    return <Navigate to="/lsc/dashboard/admin" replace />;
  }

  // User is authenticated and has proper role
  return <>{children}</>;
};
