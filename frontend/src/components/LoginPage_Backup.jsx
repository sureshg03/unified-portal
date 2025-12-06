import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, GraduationCap, Shield, Award, Sparkles, ArrowRight, Mail, Phone, Zap, Globe, TrendingUp, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';



export const LoginPage = ({ onLogin }) => {
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
      icon: <>,
      title: "Lightning Fast Access",
      description: "Instant dashboard loading with cutting-edge technology",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <>,
      title: "Global Standards",
      description: "NAAC A++ accredited with international recognition",
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      icon: <>,
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

  const handleSubmit = async (e) => {
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
    if (lscNumber.trim().length < 4) {/* Animated Background Elements */}
      <>
        <><>
        <><>
        <><>
      <>

      {/* Main Container */}
      <>
        
        {/* Left Side - Premium Branding & Features */}
        <>
          {/* Hero Section with Logo */}
          <>
            {/* Animated Background Pattern */}
            <>
              <><>
            <>
            
            <>
              <>
                <>
                  <><>
                  <>
                  <>
                    <>
                  <>
                <>
                
                <>
                  <>
                    <>
                      Periyar University
                    <>
                  <>
                  <>
                    <>
                    <>NAAC A++ • CGPA 3.61<>
                  <>
                  <>
                    🏆 NIRF Rank 56 • State Public University Rank 25
                  <>
                <>
              <>
              
              <>
                <>
                  <>
                    <>
                  <>
                  <>CDOE Portal<>
                <>
                <>
                  Centre for Distance and Online Education — Your gateway to flexible, quality education since 1983
                <>
              <>
            <>
          <>

          {/* Premium Features Showcase */}
          <>
            {/* Animated gradient background */}
            <><>
            
            <>
              <>
                <>
                Why Choose Us
              <>
              
              <>
                {features.map((feature, index) => (
                  <>
                    <>
                      {feature.icon}
                    <>
                    <>
                      <>{feature.title}<>
                      <>{feature.description}<>
                    <>
                  <>
                ))}
              <>
              
              {/* Enhanced Indicators */}
              <>
                {features.map((_, index) => (
                  <> setCurrentSlide(index)}
                    className={`transition-all duration-300 rounded-full ${
                      currentSlide === index 
                        ? 'w-12 h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg' 
                        : 'w-3 h-3 bg-gray-300 dark-gray-600 hover-gray-400'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              <>
            <>
          <>

          {/* Benefits Grid */}
          <>
            {benefits.map((benefit, index) => (
              <>
                <>
                  <>
                  <>{benefit}<>
                <>
              <>
            ))}
          <>
        <>

        {/* Right Side - Login Form */}
        <>
          {/* Mobile Logo */}
          <>
            <>
              <>
              <>
                <>
                  Periyar University
                <>
                <>CDOE Portal<>
              <>
            <>
          <>

          <>
            {/* Ultra Premium Header */}
            <>
              {/* Animated mesh background */}
              <>
                <><>
                <><>
                <><>
              <>
              
              <>
                <>
                  <>
                <>
                <>
                  Welcome Back! 
                <>
                <>
                  Access your Learning Support Centre Dashboard
                <>
                
                {/* Trust indicators */}
                <>
                  <>
                    <>
                    <>Secure Login<>
                  <>
                  <>
                    <>
                    <>Fast Access<>
                  <>
                <>
              <>
            <>

            <>
          <>
            {/* LSC Number Input */}
            <>
              <>
                <>
                LSC Number
              <>
              <>
                <><>
                <>
                <> setLscNumber(e.target.value)}
                  className="relative pl-12 pr-4 h-14 bg-gray-50 dark-gray-700/50 border-2 border-gray-200 dark-gray-600 focus-blue-500 focus-4 focus-blue-500/20 rounded-2xl transition-all duration-300 text-base font-medium hover-gray-300 dark-gray-500"
                  required
                />
              <>
            <>

            {/* Password Input */}
            <>
              <>
                <>
                  <>
                  Password
                <>
                <>
                  Forgot Password?
                <>
              <>
              <>
                <><>
                <>
                <> setPassword(e.target.value)}
                  className="relative pl-12 pr-14 h-14 bg-gray-50 dark-gray-700/50 border-2 border-gray-200 dark-gray-600 focus-purple-500 focus-4 focus-purple-500/20 rounded-2xl transition-all duration-300 text-base font-medium hover-gray-300 dark-gray-500"
                  required
                />
                <> setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover-gray-700 dark-gray-200 transition-colors p-2 hover-gray-200 dark-gray-600 rounded-xl z-10"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <> : <>}
                <>
              <>
            <>

            {/* Remember Me */}
            <>
              <>
                <>
                  <> setRememberMe(e.target.checked)}
                    className="peer w-5 h-5 rounded-lg border-2 border-gray-300 dark-gray-600 text-blue-600 focus-2 focus-blue-500/30 transition-all cursor-pointer checked-gradient-to-br checked-blue-600 checked-purple-600 checked-transparent"
                  />
                  <>
                <>
                <>
                  Keep me signed in for 30 days
                <>
              <>
            <>

            {/* Ultra Premium Login Button */}
            <>
              {/* Shimmer Effect */}
              <><>
              
              {isLoading ? (
                <>
                  <>
                  <>Authenticating...<>
                <>
              ) : (
                <>
                  <>
                  <>Sign In to Dashboard<>
                  <>
                <>
              )}
            <>

            {/* Alternative Login Hint */}
            <>
              By signing in, you agree to our Terms of Service and Privacy Policy
            <>
          <>

          {/* Elegant Divider */}
          <>
            <>
              <><>
            <>
            <>
              <>
                Quick Support
              <>
            <>
          <>

          {/* Premium Help Cards */}
          <>
            <>
              <><>
              <>
                <>
                  <>
                <>
                <>Email Support<>
                <>cdoe@periyar.edu.in<>
              <>
            <>
            
            <>
              <><>
              <>
                <>
                  <>
                <>
                <>Call Helpline<>
                <>+91 427 234 5766<>
              <>
            <>
          <>
        <>
      <>

      {/* Premium Footer */}
      <>
        <>
          <>
            <>
            <>
              Periyar University
            <>
          <>
          <>
            🏛️ Centre for Distance and Online Education
          <>
          <>
            Salem-636011, Tamil Nadu, India
          <>
          <>
            <>Privacy Policy<>
            <>•<>
            <>Terms of Service<>
            <>•<>
            <>Help Center<>
          <>
          <>
            © 2025 Periyar University. All Rights Reserved. 
          <>
        <>
      <>
    <>
      <>
    <>
  );
};


