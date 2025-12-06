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
    return <>;
  }
  
  // User is authenticated, redirect to appropriate dashboard
  if (isAdmin()) {
    return <>;
  } else if (isLSCUser()) {
    return <>;
  }
  
  // Fallback to login if role is unclear
  return <>;
};

export default Index;



