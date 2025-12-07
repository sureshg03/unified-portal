import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ activeSection, setActiveSection, userData, isProfileOpen, setIsProfileOpen, handleLogout, handleNewApplication, isSidebarOpen, setIsSidebarOpen, isPaid }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    eligibility_verified: false,
    eligibility_status: 'Pending',
    admission_confirmed: false,
    enrollment_no: null,
    application_id: null,
    first_semester_paid: false // New field for first semester payment
  });

  useEffect(() => {
    console.log('Sidebar.jsx prop:', isSidebarOpen); 
  }, [isSidebarOpen]);

  // Fetch verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for verification status fetch');
        return;
      }
      
      try {
        console.log('Fetching verification status...');
        const response = await fetch('http://localhost:8000/api/user-profile/', {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-cache' // Force fresh data
        });
        
        console.log('Verification status response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Verification status data received:', data);
          console.log('Raw response data.data:', JSON.stringify(data.data, null, 2));
          
          if (data.status === 'success' && data.data) {
            // Use backend data for first semester payment status
            const firstSemesterPaid = data.data.first_semester_paid || false;
            
            const newStatus = {
              eligibility_verified: data.data.eligibility_verified || false,
              eligibility_status: data.data.eligibility_status || 'Pending',
              admission_confirmed: data.data.admission_confirmed || false,
              enrollment_no: data.data.enrollment_no || null,
              application_id: data.data.application_id || null,
              first_semester_paid: firstSemesterPaid // Use backend API data
            };
            console.log('Setting verification status:', newStatus);
            setVerificationStatus(newStatus);
          }
        } else {
          console.error('Failed to fetch verification status:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
      }
    };

    fetchVerificationStatus();
    // Refresh every 5 seconds for more responsive updates
    const interval = setInterval(fetchVerificationStatus, 5000);
    return () => clearInterval(interval);
  }, [isPaid]); // Re-fetch when payment status changes

  const sidebarVariants = {
    hidden: { opacity: 0, x: '-100%', scale: 0.95, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1, 
      filter: 'blur(0px)', 
      transition: { 
        duration: 0.6, 
        type: 'tween'
      } 
    },
    exit: { 
      opacity: 0, 
      x: '-100%', 
      scale: 0.92, 
      filter: 'blur(8px)', 
      transition: { 
        duration: 0.4, 
        type: 'tween'
      } 
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20, x: -20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      x: 0,
      transition: { 
        duration: 0.5, 
        type: 'tween',
        delay: i * 0.08
      },
    }),
    hover: {
      x: 8,
      scale: 1.02,
      transition: { 
        duration: 0.3, 
        type: 'tween'
      },
    },
    active: { 
      scale: 0.96,
      x: 4,
      transition: { duration: 0.15, type: 'tween' } 
    },
  };

  // Helper function to get status badge
  const getStatusBadge = (itemName) => {
    console.log(`Getting badge for ${itemName}:`, verificationStatus);
    
    if (itemName === 'applicationProgress') {
      if (verificationStatus.admission_confirmed) {
        console.log('Badge: Confirmed (green)');
        return { text: 'Confirmed', color: 'bg-green-500', pulse: true };
      } else if (verificationStatus.eligibility_verified) {
        console.log('Badge: Verified (blue)');
        return { text: 'Verified', color: 'bg-blue-500', pulse: true };
      } else if (verificationStatus.eligibility_status === 'Eligible') {
        console.log('Badge: Eligible (yellow)');
        return { text: 'Eligible', color: 'bg-yellow-500', pulse: true };
      } else if (verificationStatus.eligibility_status === 'Not Eligible') {
        console.log('Badge: Rejected (red)');
        return { text: 'Rejected', color: 'bg-red-500', pulse: false };
      } else {
        console.log('Badge: Pending (gray)');
        return { text: 'Pending', color: 'bg-gray-500', pulse: false };
      }
    } else if (itemName === 'applicationDownload') {
      if (verificationStatus.admission_confirmed && verificationStatus.enrollment_no) {
        console.log('Badge: Ready (green)');
        return { text: 'Ready', color: 'bg-green-500', pulse: true };
      } else if (verificationStatus.eligibility_verified) {
        console.log('Badge: Processing (yellow)');
        return { text: 'Processing', color: 'bg-yellow-500', pulse: true };
      } else {
        console.log('Badge: Not Ready (gray)');
        return { text: 'Not Ready', color: 'bg-gray-500', pulse: false };
      }
    } else if (itemName === 'firstSemesterPayment') {
      if (verificationStatus.first_semester_paid) {
        return { text: 'Paid', color: 'bg-green-500', pulse: true };
      } else {
        return { text: 'Pay Now', color: 'bg-orange-500', pulse: true };
      }
    }
    return null;
  };

  // Conditional menu items based on verification and payment status
  const getMenuItems = () => {
    // If not eligibility verified, show limited application menu
    if (!verificationStatus.eligibility_verified) {
      return [
        { 
          name: 'dashboard', 
          label: 'Dashboard', 
          icon: HomeIcon, 
          gradient: 'from-purple-500 via-purple-500 to-purple-500',
          iconBg: 'from-purple-400 to-purple-600',
          shadow: 'shadow-purple-500/50'
        },
        { 
          name: 'newApplication', 
          label: 'Start Application', 
          icon: SparklesIcon, 
          gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
          iconBg: 'from-violet-400 to-violet-600',
          shadow: 'shadow-violet-500/50'
        },
        { 
          name: 'guidelines', 
          label: 'Guidelines', 
          icon: DocumentTextIcon, 
          gradient: 'from-purple-500 via-purple-500 to-blue-500',
          iconBg: 'from-purple-400 to-purple-600',
          shadow: 'shadow-purple-500/50'
        },
      ];
    }

    // If eligibility verified but first semester not paid, show payment prompt
    if (verificationStatus.eligibility_verified && !verificationStatus.first_semester_paid) {
      return [
        { 
          name: 'dashboard', 
          label: 'Dashboard', 
          icon: HomeIcon, 
          gradient: 'from-purple-700 via-purple-500 to-purple-500',
          iconBg: 'from-purple-400 to-purple-600',
          shadow: 'shadow-purple-500/50'
        },
        { 
          name: 'applicationProgress', 
          label: 'Check Application Status', 
          icon: ClipboardDocumentCheckIcon, 
          gradient: 'from-pink-700 via-pink-700 to-pink-700',
          iconBg: 'from-pink-400 to-pink-600',
          shadow: 'shadow-violet-500/50',
          badge: true
        },
        { 
          name: 'applicationDownload', 
          label: 'Download Application Form', 
          icon: ArrowDownTrayIcon, 
          gradient: 'from-blue-600 via-blue-600 to-blue-600',
          iconBg: 'from-blue-400 to-blue-600',
          shadow: 'shadow-cyan-500/50',
          badge: true
        },
        { 
          name: 'firstSemesterPayment', 
          label: 'Pay First Semester Fee', 
          icon: BanknotesIcon, 
          gradient: 'from-green-600 via-green-600 to-green-600',
          iconBg: 'from-green-400 to-green-600',
          shadow: 'shadow-emerald-500/50',
          badge: true
        },
      ];
    }

    // If eligibility verified and first semester paid, show full student portal
    return [
      { 
        name: 'dashboard', 
        label: 'Dashboard', 
        icon: HomeIcon, 
        gradient: 'from-purple-700 via-purple-500 to-purple-500',
        iconBg: 'from-purple-400 to-purple-600',
        shadow: 'shadow-purple-500/50'
      },
      { 
        name: 'studentIdCard', 
        label: 'Student ID Card', 
        icon: UserCircleIcon, 
        gradient: 'from-blue-600 via-blue-600 to-blue-600',
        iconBg: 'from-blue-400 to-blue-600',
        shadow: 'shadow-cyan-500/50'
      },
      { 
        name: 'profile', 
        label: 'Profile & Settings', 
        icon: UserCircleIcon, 
        gradient: 'from-indigo-600 via-indigo-600 to-indigo-600',
        iconBg: 'from-indigo-400 to-indigo-600',
        shadow: 'shadow-indigo-500/50'
      },
      { 
        name: 'payments', 
        label: 'Semester Payments', 
        icon: BanknotesIcon, 
        gradient: 'from-green-600 via-green-600 to-green-600',
        iconBg: 'from-green-400 to-green-600',
        shadow: 'shadow-emerald-500/50'
      },
      { 
        name: 'paymentHistory', 
        label: 'Payment History', 
        icon: BanknotesIcon, 
        gradient: 'from-emerald-600 via-emerald-600 to-emerald-600',
        iconBg: 'from-emerald-400 to-emerald-600',
        shadow: 'shadow-emerald-500/50'
      },
      { 
        name: 'materials', 
        label: 'Study Materials', 
        icon: DocumentTextIcon, 
        gradient: 'from-orange-600 via-orange-600 to-orange-600',
        iconBg: 'from-orange-400 to-orange-600',
        shadow: 'shadow-orange-500/50'
      },
      { 
        name: 'videoLessons', 
        label: 'Video Lessons', 
        icon: AcademicCapIcon, 
        gradient: 'from-red-600 via-red-600 to-red-600',
        iconBg: 'from-red-400 to-red-600',
        shadow: 'shadow-red-500/50'
      },
      { 
        name: 'assignments', 
        label: 'Assignments', 
        icon: ClipboardDocumentCheckIcon, 
        gradient: 'from-yellow-600 via-yellow-600 to-yellow-600',
        iconBg: 'from-yellow-400 to-yellow-600',
        shadow: 'shadow-yellow-500/50'
      },
      { 
        name: 'feedback', 
        label: 'Feedback', 
        icon: SparklesIcon, 
        gradient: 'from-pink-600 via-pink-600 to-pink-600',
        iconBg: 'from-pink-400 to-pink-600',
        shadow: 'shadow-pink-500/50'
      },
    ];
  };

  const menuItems = getMenuItems();

  // Defensive: fallback for missing userData
  const safeUserData = userData || { name: '', email: '', photo_url: '' };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <motion.aside
            className="fixed sm:static top-0 left-0 w-4/5 max-w-xs sm:w-56 md:w-60 lg:w-64 xl:w-72 min-h-screen max-h-screen bg-gradient-to-br from-purple-900 via-purple-900 to-purple-900 flex flex-col z-40 overflow-visible sm:overflow-y-auto shadow-2xl backdrop-blur-2xl sm:shadow-none sm:z-20 border-r border-purple-500/20 transition-all duration-300"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              background: 'linear-gradient(135deg, #220435ff  0%, #270442ff 50%, #230238ff  100%)',
            }}
          >
          {/* Animated Background Effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 30, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.6, 0.4],
                x: [0, -20, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Header Section with Enhanced Design */}
          <div className="relative px-3 sm:px-4 md:px-5 lg:px-6 pt-2 sm:pt-3 md:pt-4 pb-4 sm:pb-5 md:pb-6 flex-shrink-0">
            <motion.div
              className="flex items-center space-x-3 sm:space-x-4 bg-gradient-to-r from-purple-800/30 to-purple-800/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-400/20 shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full  opacity-70"></div>
                <img
                  src="/Logo.png"
                  alt="Periyar University Logo"
                  className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full shadow-2xl border-2 border-purple-400 object-cover"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/64?text=PU')}
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <motion.h1 
                  className="text-sm sm:text-base md:text-lg lg:text-xl font-bold font-poppins bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent tracking-wide"
                  animate={{
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% auto',
                  }}
                >
                  Periyar University
                </motion.h1>
                <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-0.5">Student Portal</p>
              </div>
              
            </motion.div>
          </div>

          {/* Navigation Menu with Modern Design */}
          <nav className="flex-1 space-y-1.5 sm:space-y-2 px-2 sm:px-3 md:px-4 lg:px-5 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent hover:scrollbar-thumb-purple-500/50">
            {menuItems.map((item, index) => {
              const isActive = activeSection === item.name;
              const isHovered = hoveredItem === item.name;

              return (
                // @ts-ignore
                <motion.div
                  key={item.name}
                  custom={index}
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  onHoverStart={() => setHoveredItem(item.name)}
                  onHoverEnd={() => setHoveredItem(null)}
                >
                  <motion.button
                    whileHover="hover"
                    whileTap="active"
                    onClick={() => {
                      setActiveSection(item.name);
                      if (window.innerWidth < 640) setIsSidebarOpen(false);
                    }}
                    className={`
                      relative w-full px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-poppins font-semibold text-xs sm:text-sm 
                      flex items-center gap-2 sm:gap-3 transition-all duration-300 overflow-hidden group
                      ${isActive 
                        ? 'text-white shadow-lg' 
                        : 'text-purple-200 hover:text-white'
                      }
                    `}
                  >
                    {/* Background Gradient */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                    />
                    
                    {/* Active State Background */}
                    {isActive && (
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${item.gradient}`}
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Border Glow Effect */}
                    <motion.div
                      className={`absolute inset-0 rounded-xl border-2 ${
                        isActive ? 'border-white/30' : 'border-purple-500/0 group-hover:border-purple-400/30'
                      } transition-all duration-300`}
                    />

                    {/* Shadow Effect */}
                    {(isActive || isHovered) && (
                      <motion.div
                        className={`absolute -inset-1 ${item.shadow} blur-lg opacity-30`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Icon Container with Enhanced Styling */}
                    <motion.div
                      className={`
                        relative z-10 p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${item.iconBg}
                        shadow-lg flex items-center justify-center flex-shrink-0
                        ${isActive ? 'ring-2 ring-white/40' : 'ring-1 ring-white/20'}
                      `}
                      animate={isActive ? {
                        rotate: [0, -5, 5, 0],
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut"
                      }}
                    >
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
                    </motion.div>

                    {/* Label */}
                    <span className="relative z-10 font-semibold tracking-wide flex-1 text-left text-xs sm:text-sm truncate">
                      {item.label}
                    </span>

                    {/* Status Badge */}
                    {item.badge && (() => {
                      const badge = getStatusBadge(item.name);
                      if (badge) {
                        return (
                          <motion.div
                            className={`relative z-10 ml-auto px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-white ${badge.color} shadow-lg flex items-center gap-1 flex-shrink-0`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {badge.pulse && (
                              <span className={`w-1.5 h-1.5 ${badge.color} rounded-full animate-pulse`}></span>
                            )}
                            {badge.text}
                          </motion.div>
                        );
                      }
                      return null;
                    })()}

                    {/* Active Indicator Dot */}
                    {isActive && !item.badge && (
                      <motion.div
                        className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Hover Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={isHovered ? { x: '100%' } : { x: '-100%' }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                  </motion.button>
                </motion.div>
              );
            })}
          </nav>

          {/* Enhanced Profile Section */}
          <motion.div
            className="relative mt-auto mx-2 sm:mx-3 md:mx-4 lg:mx-5 mb-2 sm:mb-3 md:mb-4 lg:mb-5 flex-shrink-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Decorative Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-400/30"></div>
              </div>
              <div className="relative flex justify-center">
                <motion.div
                  className="px-4 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(168, 85, 247, 0.4)',
                      '0 0 10px rgba(168, 85, 247, 0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-xs font-semibold text-white">Profile</span>
                </motion.div>
              </div>
            </div>

            <motion.div
              className="relative bg-gradient-to-br from-purple-800/40 via-purple-800/40 to-purple-900/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-purple-400/30 overflow-hidden"
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-500/10 to-purple-500/10 animate-pulse"></div>

              <motion.div
                className="relative flex items-center space-x-3 cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                {/* Avatar with Ring Animation */}
                <motion.div
                  className="relative"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-purple-500 to-purple-500 "
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    }}
                  />
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 flex items-center justify-center shadow-xl ring-2 ring-white/50 ring-offset-2 ring-offset-purple-900 overflow-hidden">
                    {safeUserData.photo_url ? (
                      <img
                        src={safeUserData.photo_url}
                        alt={safeUserData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <UserCircleIcon 
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white drop-shadow-lg" 
                      style={{ display: safeUserData.photo_url ? 'none' : 'block' }}
                    />
                  </div>
                </motion.div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="font-poppins font-bold text-xs sm:text-sm md:text-base text-white truncate drop-shadow-lg">
                      {safeUserData.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-purple-300 font-medium truncate flex items-center gap-1">
                      <span>{safeUserData.email}</span>
                      {isProfileOpen ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Expanded Profile Section */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 border-t border-purple-400/30"
                  >
                    <motion.button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);

};

export default Sidebar;
