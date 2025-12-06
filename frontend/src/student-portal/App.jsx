/**
 * Unified Application Entry Point
 * Combines CDOE LSC Portal and Student Admission Portal
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import DocumentResubmission from './components/modules/DocumentResubmission';
import ResubmissionSuccess from './components/modules/ResubmissionSuccess';

// Landing page component that shows selection between portals
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Education Portal
          </h1>
          <p className="text-xl text-gray-600">
            Choose your portal to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* LSC Portal Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">CDOE LSC Portal</h2>
              <p className="text-gray-600 mb-6">
                Access the Learning Support Center portal for administrators and LSC users
              </p>
              <a
                href="/lsc"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enter LSC Portal
              </a>
            </div>
          </div>

          {/* Student Admission Portal Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Student Admission Portal</h2>
              <p className="text-gray-600 mb-6">
                Apply for admissions and manage your student application
              </p>
              <a
                href="/student"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
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
    return <Navigate to="/lsc/admin" replace />;
  } else if (isLSCUser()) {
    return <Navigate to="/lsc/user" replace />;
  }

  return <Navigate to="/" replace />;
};

const App = () => {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          {/* Main Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* ========================================
              CDOE LSC PORTAL ROUTES
          ======================================== */}
          <Route path="/lsc" element={<LSCLandingPage />} />

          <Route path="/lsc/login" element={
            isLSCAuthenticated() ? (
              <Navigate to="/lsc" replace />
            ) : (
              <LSCLogin />
            )
          } />

          <Route
            path="/lsc/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lsc/user"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* ========================================
              STUDENT ADMISSION PORTAL ROUTES
          ======================================== */}
          <Route path="/student" element={<Navigate to="/student/login" replace />} />
          <Route path="/student/login" element={<Login />} />
          <Route path="/student/signup" element={<SignupForm />} />
          <Route path="/student/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/student/otp-verification" element={<OTPVerification />} />
          <Route path="/student/reset-password" element={<ResetPasswordForm />} />
          <Route path="/student/dashboard" element={<Dashboard />} />
          <Route path="/student/application/1" element={<ApplicationPage1 />} />
          <Route path="/student/application/2" element={<ApplicationPage2 />} />
          <Route path="/student/application/3" element={<EducationalQualificationPage />} />
          <Route path="/student/application/4" element={<ApplicationPage4 />} />
          <Route path="/student/application/5" element={<ApplicationPage5 />} />
          <Route path="/student/preview" element={<Preview />} />
          <Route path="/student/submitted" element={<SubmittedApplication />} />
          <Route path="/student/view-application" element={<ViewApplication />} />
          <Route path="/student/payment" element={<PaymentPage />} />
          <Route path="/student/closed" element={<ApplicationClosed />} />

          {/* Document Resubmission Routes */}
          <Route path="/student/resubmission" element={<DocumentResubmission />} />
          <Route path="/student/resubmission-success" element={<ResubmissionSuccess />} />

          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  );
};

export default App;



