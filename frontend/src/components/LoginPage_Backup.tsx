import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, GraduationCap, Shield, Award, Sparkles, ArrowRight, Mail, Phone, Zap, Globe, TrendingUp, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';

interface LoginPageProps {
  onLogin: (lscNumber: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [lscNumber, setLscNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();

  // Auto-sliding testimonials/features
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Enhanced Features data
  const features = [
    {
      icon: <Zap className="w-7 h-7" />,
      title: "Lightning Fast Access",
      description: "Instant dashboard loading with cutting-edge technology",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: "Global Standards",
      description: "NAAC A++ accredited with international recognition",
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: "Career Growth",
      description: "Empowering 15,000+ learners towards excellence",
      gradient: "from-purple-400 to-pink-500"
    }
  ];

  // Testimonials/Benefits
  const benefits = [
    "24/7 Portal Access",
    "Real-time Updates",
    "Mobile Responsive",
    "Secure Platform"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!lscNumber || !password) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please enter both LSC Code and Password",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Validate LSC code format (basic validation)
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
      const { access, refresh, user } = response.data;

      // Store tokens and user info
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_info', JSON.stringify(user));

      // Show success message
      toast({
        title: "✅ Login Successful",
        description: `Welcome back, ${user?.lsc_name || lscNumber}!`,
        className: "bg-primary text-white",
        duration: 3000,
      });

      // Redirect to dashboard
      onLogin(lscNumber);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      let errorTitle = "🔒 Login Failed";
      let errorMessage = "Invalid LSC Code or Password";
      
      if (error.response) {
        // Server responded with error
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
        // Network error - no response received
        errorTitle = "🌐 Connection Error";
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } else {
        // Other error
        errorMessage = error.message || "An unexpected error occurred.";
      }
      
      // Show error toast
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Side - Premium Branding & Features */}
        <div className="hidden lg:block space-y-6 animate-fade-in-left">
          {/* Hero Section with Logo */}
          <div className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/30 dark:to-purple-900/30 backdrop-blur-xl rounded-[2rem] p-10 shadow-2xl border border-white/40 overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-start gap-6 mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <img 
                    src="/Logo.png" 
                    alt="Periyar University" 
                    className="relative w-28 h-28 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-xl animate-pulse-soft">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h1 className="text-4xl font-black mb-3">
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Periyar University
                    </span>
                  </h1>
                  <div className="flex items-center gap-2 mb-2 bg-yellow-50 dark:bg-yellow-900/30 px-4 py-2 rounded-full inline-flex">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-sm text-gray-800 dark:text-yellow-100">NAAC A++ • CGPA 3.61</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    🏆 NIRF Rank 56 • State Public University Rank 25
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-[1.02] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold">CDOE Portal</h2>
                </div>
                <p className="text-blue-50 leading-relaxed">
                  Centre for Distance and Online Education — Your gateway to flexible, quality education since 1983
                </p>
              </div>
            </div>
          </div>

          {/* Premium Features Showcase */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/40 min-h-[280px] relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-gradient"></div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Why Choose Us
              </h3>
              
              <div className="space-y-5">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 transition-all duration-700 ${
                      currentSlide === index 
                        ? 'opacity-100 translate-x-0 scale-100' 
                        : 'opacity-0 absolute translate-x-8 scale-95'
                    }`}
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-xl transform hover:rotate-6 transition-transform`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{feature.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Enhanced Indicators */}
              <div className="flex justify-center gap-3 mt-8">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`transition-all duration-300 rounded-full ${
                      currentSlide === index 
                        ? 'w-12 h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg' 
                        : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/40 hover:shadow-xl hover:scale-105 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-125 transition-transform" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{benefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-xl mx-auto animate-fade-in-right">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20">
              <img 
                src="/Logo.png" 
                alt="Periyar University Logo" 
                className="w-16 h-16 object-contain drop-shadow-lg"
              />
              <div className="text-left">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Periyar University
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-300">CDOE Portal</p>
              </div>
            </div>
          </div>

          <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl overflow-hidden rounded-3xl">
            {/* Ultra Premium Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 p-10 overflow-hidden">
              {/* Animated mesh background */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-embrald-500/20 animate-gradient"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 mx-auto bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl mb-5 transform hover:scale-110 hover:rotate-3 transition-all">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3 tracking-tight">
                  Welcome Back! 
                </h2>
                <p className="text-blue-50 text-center text-base font-medium">
                  Access your Learning Support Centre Dashboard
                </p>
                
                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-lg px-4 py-2 rounded-full">
                    <Shield className="w-4 h-4 text-white" />
                    <span className="text-xs font-semibold text-white">Secure Login</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-lg px-4 py-2 rounded-full">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-xs font-semibold text-white">Fast Access</span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="px-6 sm:px-10 py-10 sm:py-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* LSC Number Input */}
            <div className="space-y-3">
              <Label htmlFor="lscNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                LSC Number
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition-opacity"></div>
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-all z-10" />
                <Input
                  id="lscNumber"
                  type="text"
                  placeholder="Enter your LSC Number (e.g., LC2101-CDOE)"
                  value={lscNumber}
                  onChange={(e) => setLscNumber(e.target.value)}
                  className="relative pl-12 pr-4 h-14 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-base font-medium hover:border-gray-300 dark:hover:border-gray-500"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  Password
                </span>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition-colors hover:underline"
                >
                  Forgot Password?
                </button>
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition-opacity"></div>
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-all z-10" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative pl-12 pr-14 h-14 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-2xl transition-all duration-300 text-base font-medium hover:border-gray-300 dark:hover:border-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl z-10"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer checked:bg-gradient-to-br checked:from-blue-600 checked:to-purple-600 checked:border-transparent"
                  />
                  <CheckCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Keep me signed in for 30 days
                </span>
              </label>
            </div>

            {/* Ultra Premium Login Button */}
            <Button 
              type="submit" 
              className="relative w-full h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] group overflow-hidden mt-8"
              disabled={isLoading}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              
              {isLoading ? (
                <span className="flex items-center justify-center gap-3 relative z-10">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-bold">Authenticating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3 relative z-10">
                  <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span className="font-black tracking-wide">Sign In to Dashboard</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              )}
            </Button>

            {/* Alternative Login Hint */}
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          {/* Elegant Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-6 py-2 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 rounded-full border-2 border-gray-200 dark:border-gray-700">
                Quick Support
              </span>
            </div>
          </div>

          {/* Premium Help Cards */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="mailto:cdoe@periyar.edu.in"
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl p-5 border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email Support</p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">cdoe@periyar.edu.in</p>
              </div>
            </a>
            
            <a
              href="tel:+914272345766"
              className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-5 border-2 border-purple-200/50 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Call Helpline</p>
                <p className="text-sm font-bold text-purple-700 dark:text-purple-300">+91 427 234 5766</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Premium Footer */}
      <div className="mt-10 text-center">
        <div className="bg-gradient-to-r from-white/70 via-blue-50/70 to-purple-50/70 dark:from-gray-800/70 dark:via-blue-900/30 dark:to-purple-900/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/Logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Periyar University
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            🏛️ Centre for Distance and Online Education
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Salem-636011, Tamil Nadu, India
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <a href="#" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Privacy Policy</a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a href="#" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Terms of Service</a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a href="#" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Help Center</a>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            © 2025 Periyar University. All Rights Reserved. 
          </p>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};