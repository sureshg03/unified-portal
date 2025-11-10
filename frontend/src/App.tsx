/**
 * Unified Application Entry Point
 * Combines CDOE LSC Portal and Student Admission Portal
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// LSC Portal Components
import { LoginPage as LSCLogin } from '@/components/LoginPage';
import { AdminDashboard } from '@/components/AdminDashboard';
import { UserDashboard } from '@/components/UserDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { isAuthenticated as isLSCAuthenticated, isAdmin, isLSCUser } from '@/lib/auth';
import NotFound from './lsc-portal/pages/NotFound';

// Student Admission Portal Components
import SignupForm from './student-portal/components/SignupForm';
import ApplicationClosed from './student-portal/components/ApplicationClosed';
import Login from './student-portal/components/Login';
import ForgotPasswordForm from './student-portal/components/ForgotPasswordForm';
import OTPVerification from './student-portal/components/OTPVerification';
import ResetPasswordForm from './student-portal/components/ResetPasswordForm';
import Dashboard from './student-portal/pages/Dashboard';
import ApplicationPage1 from './student-portal/pages/ApplicationPage1';
import ApplicationPage2 from './student-portal/pages/ApplicationPage2';
import EducationalQualificationPage from './student-portal/pages/EducationalQualificationPage';
import ApplicationPage4 from './student-portal/pages/ApplicationPage4';
import Preview from './student-portal/pages/Preview';
import ApplicationPage5 from './student-portal/pages/ApplicationPage5';
import SubmittedApplication from './student-portal/pages/SubmittedApplication';
import ViewApplication from './student-portal/components/ViewApplication';
import PaymentPage from './student-portal/pages/PaymentPage';

const queryClient = new QueryClient();

// Landing page component that shows selection between portals
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Education Portal
          </h1>
          <p className="text-xl text-gray-600">
            Choose your portal to continue
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* LSC Portal Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">CDOE LSC Portal</h2>
              <p className="text-gray-600 mb-6">
                Access the Learning Support Center portal for administrators and LSC users
              </p>
              <a
                href="/lsc/login"
                className="inline-block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Enter LSC Portal
              </a>
            </div>
          </div>

          {/* Student Admission Portal Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Student Admission Portal</h2>
              <p className="text-gray-600 mb-6">
                Apply for admissions and manage your student application
              </p>
              <a
                href="/student/login"
                className="inline-block w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Enter Student Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// LSC Landing redirector
const LSCLandingPage = () => {
  if (!isLSCAuthenticated()) {
    return <Navigate to="/lsc/login" replace />;
  }
  
  if (isAdmin()) {
    return <Navigate to="/lsc/dashboard/admin" replace />;
  } else if (isLSCUser()) {
    return <Navigate to="/lsc/dashboard/user" replace />;
  }
  
  return <Navigate to="/lsc/login" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            {/* Main Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* ========================================
                CDOE LSC PORTAL ROUTES
            ======================================== */}
            <Route path="/lsc" element={<LSCLandingPage />} />
            
            <Route 
              path="/lsc/login" 
              element={
                isLSCAuthenticated() ? (
                  isAdmin() ? <Navigate to="/lsc/dashboard/admin" replace /> : <Navigate to="/lsc/dashboard/user" replace />
                ) : (
                  <LSCLogin onLogin={() => {}} />
                )
              } 
            />
            
            <Route 
              path="/lsc/dashboard/admin/*" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/lsc/dashboard/user" 
              element={
                <ProtectedRoute requireUser={true}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* ========================================
                STUDENT ADMISSION PORTAL ROUTES
            ======================================== */}
            <Route path="/student" element={<Navigate to="/student/login" />} />
            <Route path="/student/signup" element={<SignupForm />} />
            <Route path="/student/application-closed" element={<ApplicationClosed />} />
            <Route path="/student/login" element={<Login />} />
            <Route path="/student/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/student/otp-verification" element={<OTPVerification />} />
            <Route path="/student/reset-password" element={<ResetPasswordForm />} />
            <Route path="/student/dashboard" element={<Dashboard />} />
            <Route path="/student/application/page1" element={<ApplicationPage1 />} />
            <Route path="/student/application/page2" element={<ApplicationPage2 />} />
            <Route path="/student/application/page3" element={<EducationalQualificationPage />} />
            <Route path="/student/application/page4" element={<ApplicationPage4 />} />
            <Route path="/student/application/page5" element={<Preview />} />
            <Route path="/student/application/page6" element={<ApplicationPage5 />} />
            <Route path="/student/application/submitted" element={<SubmittedApplication />} />
            <Route path="/student/dashboard/view/*" element={<ViewApplication />} />
            <Route path="/student/application/payment" element={<PaymentPage />} />
            
            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
