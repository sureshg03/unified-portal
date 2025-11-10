import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminDashboard } from "./components/AdminDashboard";
import { UserDashboard } from "./components/UserDashboard";
import { LoginPage } from "./components/LoginPage";
import { isAuthenticated, isAdmin, isLSCUser } from "./lib/auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Landing page component that redirects based on auth status
const LandingPage = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to appropriate dashboard based on role
  if (isAdmin()) {
    return <Navigate to="/dashboard/admin" replace />;
  } else if (isLSCUser()) {
    return <Navigate to="/dashboard/user" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
        <Routes>
          {/* Landing page - redirects based on auth */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Login route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? (
                isAdmin() ? <Navigate to="/dashboard/admin" replace /> : <Navigate to="/dashboard/user" replace />
              ) : (
                <LoginPage onLogin={() => {}} />
              )
            } 
          />
          
          {/* Admin Dashboard - Protected Routes */}
          <Route 
            path="/dashboard/admin/*" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* User Dashboard - Protected Route */}
          <Route 
            path="/dashboard/user" 
            element={
              <ProtectedRoute requireUser={true}>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
