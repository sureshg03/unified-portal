import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, GraduationCap, Shield, Award, Sparkles, ArrowRight, Mail, Phone, Zap, Globe2, Users2, CheckCircle2, BookOpen, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import { setAuthData } from '@/lib/auth';

interface LoginPageProps {
  onLogin: (lscNumber: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const navigate = useNavigate();
  const [lscNumber, setLscNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Remove loading screen immediately - no animation delay
    setPageLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lscNumber || !password) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please enter both LSC Code and Password",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    if (lscNumber.trim().length < 4) {
      toast({
        title: "⚠️ Invalid LSC Code",
        description: "LSC Code must be at least 4 characters long",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login(lscNumber.trim(), password);
      const { access, refresh, user, message } = response.data;

      // Store authentication data using secure utility function
      setAuthData(access, refresh, user);

      toast({
        title: "✅ Login Successful",
        description: message || `Welcome back, ${user?.lsc_name || lscNumber}!`,
        duration: 3000,
      });

      // Redirect based on user type
      if (user.user_type === 'admin') {
        navigate('/lsc/dashboard/admin', { replace: true });
      } else if (user.user_type === 'user') {
        navigate('/lsc/dashboard/user', { replace: true });
      } else {
        // Fallback
        navigate('/lsc/login', { replace: true });
      }

      // Call the legacy onLogin if needed
      onLogin(lscNumber);
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorTitle = "🔒 Login Failed";
      let errorMessage = "Invalid LSC Code or Password";
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 400) {
          errorMessage = data?.detail || "Invalid LSC Code or Password. Please check your credentials.";
        } else if (status === 403) {
          errorTitle = "⛔ Access Denied";
          errorMessage = data?.detail || "Your account has been deactivated. Please contact the administrator.";
        } else if (status === 500) {
          errorTitle = "⚠️ Server Error";
          errorMessage = "An error occurred on the server. Please try again later.";
        } else {
          errorMessage = data?.detail || data?.error || "An unexpected error occurred.";
        }
      } else if (error.request) {
        errorTitle = "🌐 Connection Error";
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } else {
        errorMessage = error.message || "An unexpected error occurred.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  // No loading screen - removed for better UX

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-green-50 to-green-50 flex items-center justify-center p-4 overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-green-300 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-green-300 to-pink-300 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 border-4 border-indigo-300/30 rounded-2xl rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border-4 border-green-300/30 rounded-full"></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 border-4 border-pink-300/30 rounded-2xl rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-20 h-20 bg-indigo-300/20 rounded-lg rotate-12"></div>
        
        {/* Decorative Dots */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-green-400/40 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-indigo-200/50 overflow-hidden">
        
        {/* Left Panel - Enhanced Branding */}
        <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-600 p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
          {/* Static Background Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white/10 rounded-full"
                style={{
                  width: `${Math.random() * 30 + 5}px`,
                  height: `${Math.random() * 30 + 5}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Decorative Shapes */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-28 -translate-x-28"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 border-4 border-white/10 rounded-2xl rotate-45"></div>

          <div className="relative z-10">
            {/* Logo and University Header */}
            <div className="text-center mb-6">
              <div className="relative w-36 h-36 mx-auto mb-5">
                <div className="relative w-full h-full rounded-full bg-white backdrop-blur-md p-4 shadow-2xl border-4 border-yellow-500">
                  <img 
                    src="/Logo.png" 
                    alt="Periyar University Logo" 
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              
              <h1 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Periyar University
              </h1>
              
              <div className="mb-4 space-y-1.5">
                <p className="text-yellow-300 text-sm font-bold tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                  State University • NAAC 'A++' Grade
                </p>
                <p className="text-white/90 text-xs font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                  NIRF Rank 94 • State Public University Rank 40
                </p>
                <p className="text-white/80 text-xs font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                  SDG Institutions Rank Band: 11-50
                </p>
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/40 backdrop-blur-md rounded-xl border border-green-400/30 shadow-lg">
                <Building2 className="w-4 h-4 text-yellow-300" />
                <p className="text-white text-xs font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Salem-636011, Tamil Nadu, India
                </p>
              </div>
            </div>

            {/* CDOE Section */}
            <div className="relative bg-gradient-to-br from-green-900/50 to-green-800/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-yellow-400/40 shadow-2xl overflow-hidden mb-5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/10 rounded-full translate-y-16 -translate-x-16"></div>
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-2xl border-2 border-white/20">
                  <GraduationCap className="w-9 h-9 text-green-900" />
                </div>
                <h2 className="text-2xl font-black text-yellow-300 mb-3 drop-shadow-lg leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  CENTRE FOR DISTANCE AND<br />ONLINE EDUCATION
                </h2>
                <div className="inline-block px-4 py-1.5 bg-yellow-400/20 backdrop-blur-sm rounded-full border border-yellow-400/40">
                  <p className="text-white text-sm font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Open and Distance Learning
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Panel - Premium Login Form */}
        <div className="relative bg-white p-8 lg:p-12 flex items-center justify-center overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.4) 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}></div>
          </div>

          <div className="relative z-10 w-full max-w-md space-y-8">
            {/* Premium Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-700 via-green-600 to-green-600 mb-6 shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-600 rounded-3xl blur-xl opacity-50"></div>
                <Shield className="w-10 h-10 text-white relative z-10" />
              </div>
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-green-700 via-green-600 to-green-600 bg-clip-text text-transparent mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                LSC Portal
              </h2>
              <p className="text-gray-600 font-medium flex items-center justify-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                <User className="w-4 h-4" />
                Sign in to access your dashboard
              </p>
            </div>

            {/* Premium Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* LSC Number Input */}
              <div className="space-y-2">
                <Label htmlFor="lscNumber" className="text-sm font-bold text-gray-700 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <User className="w-4 h-4 text-indigo-600" />
                  LSC Number 
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-green-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300"></div>
                  <Input
                    id="lscNumber"
                    type="text"
                    value={lscNumber}
                    onChange={(e) => setLscNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="relative pl-12 h-14 border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-base font-medium shadow-sm transition-all duration-300"
                    placeholder="LSC Number (Ex: LSC2101)"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-green-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-gray-700 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <Lock className="w-4 h-4 text-green-600" />
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-pink-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300"></div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="relative pl-12 pr-12 h-14 border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base font-medium shadow-sm transition-all duration-300"
                    placeholder="************"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-pink-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-600" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors hover:underline"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Ultra Premium Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-green-700 via-green-600 to-green-600 hover:from-green-700 hover:via-green-700 hover:to-green-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 text-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </span>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In</span>

                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
