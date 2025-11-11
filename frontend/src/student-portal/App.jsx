import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupForm from './components/SignupForm';
import Login from './components/Login';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import OTPVerification from './components/OTPVerification';
import ResetPasswordForm from './components/ResetPasswordForm';
import Dashboard from './pages/Dashboard';
import ApplicationPage1 from './pages/ApplicationPage1';
import ApplicationPage2 from './pages/ApplicationPage2';
import EducationalQualificationPage from './pages/EducationalQualificationPage';
import ApplicationPage4 from './pages/ApplicationPage4';
import Preview from './pages/Preview';
import ApplicationPage5 from './pages/ApplicationPage5';
import SubmittedApplication from './pages/SubmittedApplication';
import ViewApplication from './components/ViewApplication';
import Payment from './components/Payment'; // NEW: Updated to use Payment component with dummy payment
import ApplicationDownload from './pages/ApplicationDownload';
import PaymentHistory from './pages/PaymentHistory';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/application/page1" element={<ApplicationPage1 />} />
        <Route path="/application/page2" element={<ApplicationPage2 />} />
        <Route path="/application/page3" element={<EducationalQualificationPage />} />
        <Route path="/application/page4" element={<ApplicationPage4 />} />
        <Route path="/application/page5" element={<Preview />} />
        <Route path="/application/page6" element={<ApplicationPage5 />} />
        <Route path="/application/submitted" element={<SubmittedApplication />} />
        <Route path="/application-download/:applicationId" element={<ApplicationDownload />} />
        <Route path="/dashboard/view/*" element={<ViewApplication />} />
        <Route path="/application/payment" element={<Payment />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        {/* 404 Not Found - Must be last route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;