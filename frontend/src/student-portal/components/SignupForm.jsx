import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon, PhoneIcon, UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';

const InputField = ({ name, type, placeholder, value, onChange, icon: Icon, error, isValid }) => (
  <div className="relative group">
    <div className="relative">
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full p-3 sm:p-3.5 pl-11 sm:pl-12 pr-12 rounded-lg bg-white/95 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-gray-900 placeholder-gray-400/70 shadow-sm group-hover:shadow-purple-300/50 font-nunito text-base sm:text-lg tracking-wide hover:bg-purple-50/50"
        aria-label={name}
      />
      <Icon className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-600" />
      {isValid && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <CheckCircleIcon className="absolute right-3.5 sm:right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 drop-shadow-md" />
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <XCircleIcon className="absolute right-3.5 sm:right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500 drop-shadow-md" />
        </motion.div>
      )}
    </div>
    {error && (
      <motion.p
        className="text-red-500 text-sm mt-2 font-nunito font-medium animate-fadeIn"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.p>
    )}
  </div>
);

const PasswordInputField = ({ name, placeholder, value, onChange, icon: Icon, error, isValid }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group">
      <div className="relative">
        <input
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full p-3 sm:p-3.5 pl-11 sm:pl-12 pr-20 rounded-lg bg-white/95 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-gray-900 placeholder-gray-400/70 shadow-sm group-hover:shadow-purple-300/50 font-nunito text-base sm:text-lg tracking-wide hover:bg-purple-50/50"
          aria-label={name}
        />
        <Icon className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-600" />
        
        {/* Eye icon to toggle password visibility */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-12 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-800 focus:outline-none transition-colors duration-200"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </motion.div>
        </button>

        {isValid && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <CheckCircleIcon className="absolute right-3.5 sm:right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 drop-shadow-md" />
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <XCircleIcon className="absolute right-3.5 sm:right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500 drop-shadow-md" />
          </motion.div>
        )}
      </div>
      {error && (
        <motion.p
          className="text-red-500 text-sm mt-2 font-nunito font-medium animate-fadeIn"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

const SignupForm = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState({});
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [lscInfo, setLscInfo] = useState({ code: '', name: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4500);
    
    // Get LSC info from URL parameters first (higher priority)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLscCode = urlParams.get('ref') || '';
    const urlLscName = urlParams.get('center') || '';
    
    // Fallback to sessionStorage if URL params not present
    const sessionLscCode = sessionStorage.getItem('referral_lsc_code') || '';
    const sessionLscName = sessionStorage.getItem('referral_lsc_name') || '';
    
    // Use URL params if available, otherwise use sessionStorage
    const lscCode = urlLscCode || sessionLscCode;
    const lscName = urlLscName || sessionLscName;
    
    // Save to sessionStorage for consistency
    if (lscCode) {
      sessionStorage.setItem('referral_lsc_code', lscCode);
      sessionStorage.setItem('referral_lsc_name', lscName);
    }
    
    console.log('SignupForm - LSC Info:', { 
      fromURL: { lscCode: urlLscCode, lscName: urlLscName },
      fromSession: { lscCode: sessionLscCode, lscName: sessionLscName },
      final: { lscCode, lscName }
    });
    
    // Check if applications are open
    checkApplicationStatus();
    
    if (lscCode) {
      console.log('Setting LSC info:', { code: lscCode, name: lscName });
      setLscInfo({ code: lscCode, name: lscName });
    } else {
      console.log('No LSC code found in sessionStorage');
    }
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-check every 5 seconds if applications are closed
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkApplicationStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Check on window focus
  useEffect(() => {
    const handleFocus = () => {
      checkApplicationStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Check on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkApplicationStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/application-settings/');
      if (response.data && response.data.length > 0) {
        const activeSetting = response.data.find(s => s.is_active && (s.is_open || s.status === 'OPEN')) || response.data[0];
        const isOpen = activeSetting.is_open || activeSetting.status === 'OPEN';
        
        console.log('Application status check:', { isOpen, setting: activeSetting });
        
        // If applications are closed, redirect to closed page
        if (!isOpen) {
          console.log('Applications are closed, redirecting...');
          navigate('/student/application-closed' + window.location.search); // Preserve URL params
        }
      }
    } catch (error) {
      console.error('Error checking application status:', error);
      // Don't block signup if we can't check status
    }
  };

  const validateField = (name, value) => {
    let error = '';
    let valid = false;

    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        else if (value.length < 2) error = 'Name must be at least 2 characters';
        else valid = true;
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) error = 'Email is required';
        else if (!emailRegex.test(value)) error = 'Invalid email format';
        else valid = true;
        break;
      case 'phone':
        const phoneRegex = /^[0-9]{10}$/;
        if (!value) error = 'Mobile number is required';
        else if (!phoneRegex.test(value)) error = 'Mobile number must be 10 digits';
        else valid = true;
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        else valid = true;
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== form.password) error = 'Passwords do not match';
        else valid = true;
        break;
      default:
        break;
    }

    return { error, valid };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    const { error, valid } = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    setIsValid((prev) => ({ ...prev, [name]: valid }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setIsValid({});
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
  };

  const sendOTP = async () => {
    if (!form.email || errors.email) {
      toast.error('Please enter a valid email address.', {
        position: 'top-right',
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
        progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      });
      return;
    }
    setIsLoading(true);
    toast.info('Sending OTP...', {
      position: 'top-right',
      autoClose: 5000,
      className: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-xl font-nunito',
      progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      icon: (
        <motion.svg
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </motion.svg>
      ),
    });
    try {
      await axios.post('http://localhost:8000/api/send-otp/', { email: form.email });
      toast.success('OTP sent to your email! Check your inbox (expires in 5 minutes).', {
        position: 'top-right',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        className: 'bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl shadow-xl font-nunito',
        progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      });
      setOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP. Please try again.', {
        position: 'top-right',
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
        progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the OTP.', {
        position: 'top-right',
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
        progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      });
      return;
    }
    setIsLoading(true);
    toast.info('Verifying OTP...', {
      position: 'top-right',
      autoClose: 5000,
      className: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-xl font-nunito',
      progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      icon: (
        <motion.svg
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </motion.svg>
      ),
    });
    try {
      const res = await axios.post('http://localhost:8000/api/verify-otp/', {
        email: form.email,
        otp,
      });
      if (res.data.status === 'success') {
        toast.success('OTP verified successfully! You can now register.', {
          position: 'top-right',
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          className: 'bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl shadow-xl font-nunito',
          progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
        });
        setOtpVerified(true);
      } else {
        toast.error(res.data.message || 'Invalid OTP. Please try again.', {
          position: 'top-right',
          icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
          className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
          progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.', {
        position: 'top-right',
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
        progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    const fields = ['name', 'email', 'phone', 'password', 'confirmPassword'];
    let hasError = false;
    const newErrors = {};
    const newIsValid = {};

    fields.forEach((field) => {
      const { error, valid } = validateField(field, form[field]);
      newErrors[field] = error;
      newIsValid[field] = valid;
      if (error || !form[field]) hasError = true;
    });

    setErrors(newErrors);
    setIsValid(newIsValid);

    if (hasError) {
      toast.error('Please fix the errors in the form.', {
        position: 'top-right',
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
        progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      });
      resetForm();
      return;
    }

    if (!otpVerified) {
      toast.error('Please verify your email with OTP before registering.', {
        position: 'top-right',
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
        progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      });
      resetForm();
      return;
    }

    setIsLoading(true);
    toast.info('Registering...', {
      position: 'top-right',
      autoClose: 5000,
      className: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-xl font-nunito',
      progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      icon: (
        <motion.svg
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </motion.svg>
      ),
    });
    try {
      const signupData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };
      
      // Add LSC information if available
      if (lscInfo.code) {
        signupData.lsc_code = lscInfo.code;
        signupData.lsc_name = lscInfo.name;
        console.log('Sending LSC info with signup:', { lsc_code: lscInfo.code, lsc_name: lscInfo.name });
      }
      
      const response = await axios.post('http://localhost:8000/api/signup/', signupData);
      if (response.data.status === 'success') {
        toast.success('Registration successful! Redirecting to login...', {
          position: 'top-right',
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          className: 'bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl shadow-xl font-nunito',
          progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
        });
        setTimeout(() => navigate('/student/login'), 2000);
      } else {
        toast.error(response.data.message || 'Registration failed. Please try again.', {
          position: 'top-right',
          icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
          className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
          progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
        });
        resetForm();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'An error occurred during registration. Please try again.',
        {
          position: 'top-right',
          icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
          className: 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-xl font-nunito',
          progressClassName: 'bg-gradient-to-r from-purple-600 to-indigo-500',
        }
      );
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute w-80 h-80 bg-purple-200/20 rounded-full -top-20 -left-20 filter blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [-20, 20, -20], y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-indigo-200/20 rounded-full -bottom-24 -right-24 filter blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3], x: [20, -20, 20], y: [20, -20, 20] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-purple-300/15 rounded-full top-1/3 left-1/4 filter blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, 90, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_70%)]"
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {showSplash && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-100 flex items-center justify-center z-50 overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 4, duration: 0.6 }}
          onAnimationComplete={() => setShowSplash(false)}
        >
          {/* Animated Background Blobs */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <motion.div
              className="absolute w-80 h-80 bg-purple-200/20 rounded-full -top-20 -left-20 filter blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [-20, 20, -20], y: [-20, 20, -20] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-96 h-96 bg-indigo-200/20 rounded-full -bottom-24 -right-24 filter blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3], x: [20, -20, 20], y: [20, -20, 20] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.div
              className="absolute w-64 h-64 bg-purple-300/15 rounded-full top-1/3 left-1/4 filter blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, 90, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
          </div>

          {/* Static Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {/* Animated Background Shapes */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-purple-500/10 rounded-full"
                style={{
                  width: `${Math.random() * 20 + 5}px`,
                  height: `${Math.random() * 20 + 5}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-40, 40],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: Math.random() * 4 + 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo with Animated Rings */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-purple-500"
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border-4 border-indigo-400/40"
                animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              <img
                src="/Logo.png"
                alt="Periyar University Logo"
                className="w-32 h-32 rounded-full shadow-2xl border-4 border-purple-200 relative z-10"
              />
            </div>

            <motion.h2
              className="text-4xl font-extrabold text-purple-900 mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Periyar University
            </motion.h2>

            <motion.h3
              className="text-2xl font-bold text-indigo-700 mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Centre for Distance and Online Education
            </motion.h3>

            <div className="w-64 h-2 bg-purple-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <motion.p
              className="mt-4 text-purple-700 font-semibold"
              style={{ fontFamily: "'Nunito', sans-serif" }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading Student Portal...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
      {!showSplash && (
        <motion.div
          className="bg-white rounded-2xl w-full max-w-4xl sm:max-w-5xl flex flex-col lg:flex-row overflow-hidden shadow-3d border border-purple-200/50 z-10"
          initial={{ y: 50, opacity: 0, rotateX: 0, rotateY: 0 }}
          animate={{ y: 0, opacity: 1, rotateX: 3, rotateY: 3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="lg:w-1/2 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-purple-950 via-purple-800 to-indigo-700 text-white flex flex-col items-center justify-center relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-purple-900/20"
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-400/30 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="mb-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              <img
                src="/Logo.png"
                alt="Periyar University Logo"
                className="w-56 h-56 sm:w-64 sm:h-64"
              />
            </motion.div>
            <motion.h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 tracking-tight font-poppins text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Shape Your Future
            </motion.h2>
            <motion.p
              className="text-base sm:text-lg font-medium leading-relaxed font-nunito text-center max-w-sm"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Transform your career with Periyar University's state-of-the-art online learning platform, designed for excellence.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.button
                className="bg-white/30 px-6 py-3 rounded-lg text-base font-exo font-semibold hover:bg-white/40 transition-all duration-300 shadow-lg hover:shadow-purple-400/60 relative overflow-hidden"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Explore Courses</span>
                <motion.div
                  className="absolute inset-0 bg-purple-400/30"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'linear' }}
                />
              </motion.button>
              <motion.button
                className="bg-white/30 px-6 py-3 rounded-lg text-base font-exo font-semibold hover:bg-white/40 transition-all duration-300 shadow-lg hover:shadow-purple-400/60 relative overflow-hidden"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Get Started</span>
                <motion.div
                  className="absolute inset-0 bg-purple-400/30"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'linear' }}
                />
              </motion.button>
            </motion.div>
          </div>
          <div className="lg:w-1/2 p-6 sm:p-8 bg-white/95 rounded-b-2xl lg:rounded-r-2xl">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 250 }}
            >
              <img
                src="/Logo.png"
                alt="Periyar University Logo"
                className="w-16 h-16 sm:w-18 sm:h-18"
              />
            </motion.div>
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4 font-poppins"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Create Your Account
            </motion.h2>
            
            {/* LSC Information Banner */}
            {lscInfo.code && (
              <motion.div
                className="mb-6 p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-300 rounded-xl shadow-lg relative overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600"
                  animate={{ x: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider font-nunito">
                      Applying Through
                    </p>
                    <p className="text-lg font-bold text-gray-800 font-poppins">
                      {lscInfo.name}
                    </p>
                    <p className="text-sm text-indigo-600 font-nunito font-medium">
                      LSC Code: <span className="font-bold">{lscInfo.code}</span>
                    </p>
                  </div>
                  <motion.div
                    className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <p className="text-xs text-center text-gray-600 font-nunito">
                    🎓 Your application will be processed through <span className="font-bold text-purple-700">{lscInfo.name}</span>
                  </p>
                </div>
              </motion.div>
            )}
            
            <div className="space-y-4">
              <InputField
                name="name"
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                icon={UserIcon}
                error={errors.name}
                isValid={isValid.name}
              />
              <InputField
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                icon={EnvelopeIcon}
                error={errors.email}
                isValid={isValid.email}
              />
              <InputField
                name="phone"
                type="text"
                placeholder="Mobile Number"
                value={form.phone}
                onChange={handleChange}
                icon={PhoneIcon}
                error={errors.phone}
                isValid={isValid.phone}
              />
              <PasswordInputField
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                icon={LockClosedIcon}
                error={errors.password}
                isValid={isValid.password}
              />
              <PasswordInputField
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                icon={LockClosedIcon}
                error={errors.confirmPassword}
                isValid={isValid.confirmPassword}
              />
              {otpSent && !otpVerified && (
                <div className="relative group">
                  <input
                    placeholder="Enter OTP"
                    onChange={(e) => setOtp(e.target.value)}
                    value={otp}
                    className="w-full p-3 sm:p-3.5 pl-11 sm:pl-12 rounded-lg bg-white/95 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-gray-900 placeholder-gray-400/70 shadow-sm group-hover:shadow-purple-300/50 font-nunito text-base sm:text-lg tracking-wide hover:bg-purple-50/50"
                    aria-label="OTP"
                  />
                  <svg
                    className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6" />
                  </svg>
                </div>
              )}
              <motion.button
                onClick={otpSent ? (otpVerified ? handleSignup : verifyOTP) : sendOTP}
                disabled={isLoading}
                className={`w-full p-3 sm:p-3.5 rounded-lg text-white flex items-center justify-center shadow-lg font-nunito text-base sm:text-lg relative overflow-hidden transition-all duration-300 ${
                  isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 cursor-not-allowed'
                    : otpSent
                    ? otpVerified
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-500 relative'
                }`}
                whileHover={{ scale: isLoading ? 1 : 1.05, boxShadow: isLoading ? '' : '0 0 20px rgba(168, 85, 247, 0.6)' }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
              >
                {isLoading && (
                  <motion.svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </motion.svg>
                )}
                <motion.span
                  className="relative z-10"
                >
                  {isLoading
                    ? otpSent
                      ? otpVerified
                        ? 'Registering...'
                        : 'Verifying OTP...'
                      : 'Sending OTP...'
                    : otpSent
                    ? otpVerified
                      ? 'Sign Up'
                      : 'Verify OTP'
                    : 'Send OTP'}
                </motion.span>
                {!otpSent && !isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-white/30"
                    initial={{ scaleX: 0, originX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                )}
              </motion.button>
              <div className="text-center text-sm">
                <button
                  onClick={() => navigate('/student/login')}
                  className="text-purple-600 hover:text-purple-400 transition-all duration-300 font-nunito"
                >
                  Already have an account? <span className="text-blue-600">Sign in</span>
                </button>
              </div>
            </div>
            <ToastContainer 
              position="top-right" 
              autoClose={4000} 
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              style={{ marginTop: '60px' }}
              toastClassName="rounded-lg shadow-2xl border border-purple-200"
            />
          </div>
          <style jsx>{`
            .font-exo {
              font-family: 'Exo 2', sans-serif !important;
            }
            .font-lora {
              font-family: 'Lora', serif !important;
            }
            .font-nunito {
              font-family: 'Nunito Sans', sans-serif !important;
            }
            .font-poppins {
              font-family: 'Poppins', sans-serif !important;
            }
            .shadow-3d {
              box-shadow: 8px 8px 20px rgba(108, 99, 255, 0.2), -8px -8px 20px rgba(255, 255, 255, 0.8);
              transform: perspective(1200px) rotateX(3deg) rotateY(3deg);
            }
            @keyframes fadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            .animate-fadeIn {
              animation: fadeIn 0.5s ease-out;
            }
          `}</style>
        </motion.div>
      )}
    </div>
  );
};

export default SignupForm;