import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, isLSCUser } from '@/lib/auth';

/**
 * Index/Landing Page
 * Redirects users to appropriate dashboard based on authentication and role
 */
const Index = () => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, redirect to appropriate dashboard
  if (isAdmin()) {
    return <Navigate to="/dashboard/admin" replace />;
  } else if (isLSCUser()) {
    return <Navigate to="/dashboard/user" replace />;
  }
  
  // Fallback to login if role is unclear
  return <Navigate to="/login" replace />;
};

export default Index;
