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

  useEffect(() => {
    console.log('Sidebar.jsx: isSidebarOpen prop:', isSidebarOpen); 
  }, [isSidebarOpen]);

  const sidebarVariants = {
    hidden: { opacity: 0, x: '-100%', scale: 0.95, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1, 
      filter: 'blur(0px)', 
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        type: 'spring', 
        stiffness: 120,
        damping: 20
      } 
    },
    exit: { 
      opacity: 0, 
      x: '-100%', 
      scale: 0.92, 
      filter: 'blur(8px)', 
      transition: { 
        duration: 0.4, 
        ease: [0.4, 0, 1, 1]
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
        ease: [0.22, 1, 0.36, 1],
        delay: i * 0.08,
        type: 'spring', 
        stiffness: 150,
        damping: 15
      },
    }),
    hover: {
      x: 8,
      scale: 1.02,
      transition: { 
        duration: 0.3, 
        ease: 'easeOut',
        type: 'spring',
        stiffness: 400,
        damping: 10
      },
    },
    active: { 
      scale: 0.96,
      x: 4,
      transition: { duration: 0.15 } 
    },
  };

  // Conditional menu items based on payment status with enhanced styling
  const menuItems = isPaid
    ? [
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
          label: 'Application Status', 
          icon: ClipboardDocumentCheckIcon, 
          gradient: 'from-pink-700 via-pink-700 to-pink-700',
          iconBg: 'from-pink-400 to-pink-600',
          shadow: 'shadow-violet-500/50'
        },
        { 
          name: 'applicationDownload', 
          label: 'Download Application', 
          icon: ArrowDownTrayIcon, 
          gradient: 'from-blue-600 via-blue-600 to-blue-600',
          iconBg: 'from-blue-400 to-blue-600',
          shadow: 'shadow-cyan-500/50'
        },
        { 
          name: 'paymentHistory', 
          label: 'Payment History', 
          icon: BanknotesIcon, 
          gradient: 'from-green-600 via-green-600 to-green-600',
          iconBg: 'from-green-400 to-green-600',
          shadow: 'shadow-emerald-500/50'
        },
      ]
    : [
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
          icon: DocumentTextIcon, 
          gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
          iconBg: 'from-violet-400 to-violet-600',
          shadow: 'shadow-violet-500/50'
        },
        { 
          name: 'guidelines', 
          label: 'Guidelines', 
          icon: AcademicCapIcon, 
          gradient: 'from-purple-500 via-purple-500 to-blue-500',
          iconBg: 'from-purple-400 to-purple-600',
          shadow: 'shadow-purple-500/50'
        },
      ];

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          className="fixed sm:static top-0 left-0 w-full max-w-[320px] sm:w-64 lg:w-80 min-h-screen bg-gradient-to-br from-purple-900 via-purple-900 to-purple-900 flex flex-col z-40 overflow-y-auto shadow-2xl backdrop-blur-2xl sm:shadow-none sm:z-20 border-r border-purple-500/20"
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
          <div className="relative px-4 sm:px-5 lg:px-6 pt-20 sm:pt-8 lg:pt-10 pb-6">
            <motion.div
              className="flex items-center space-x-4 bg-gradient-to-r from-purple-800/30 to-purple-800/30 backdrop-blur-xl rounded-2xl p-4 border border-purple-400/20 shadow-lg"
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
                  className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full shadow-2xl border-2 border-purple-400 object-cover"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/64?text=PU')}
                />
              </motion.div>
              <div className="flex-1">
                <motion.h1 
                  className="text-base sm:text-lg lg:text-sm font-bold font-poppins bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent tracking-wide"
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
                <p className="text-xs text-purple-300/80 font-medium mt-0.5">Student Portal</p>
              </div>
              
            </motion.div>
          </div>

          {/* Navigation Menu with Modern Design */}
          <nav className="flex-1 space-y-2 px-3 sm:px-4 lg:px-5 py-2">
            {menuItems.map((item, index) => {
              const isActive = activeSection === item.name;
              const isHovered = hoveredItem === item.name;

              return (
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
                      relative w-full px-4 py-3.5 rounded-xl font-poppins font-semibold text-sm 
                      flex items-center gap-3 transition-all duration-300 overflow-hidden group
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
                        relative z-10 p-2 rounded-lg bg-gradient-to-br ${item.iconBg}
                        shadow-lg flex items-center justify-center
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
                      <item.icon className="w-5 h-5 text-white drop-shadow-lg" />
                    </motion.div>

                    {/* Label */}
                    <span className="relative z-10 font-semibold tracking-wide">
                      {item.label}
                    </span>

                    {/* Active Indicator Dot */}
                    {isActive && (
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
            className="relative mt-auto mx-3 sm:mx-4 lg:mx-5 mb-3 sm:mb-4 lg:mb-5"
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
              className="relative bg-gradient-to-br from-purple-800/40 via-purple-800/40 to-purple-900/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-purple-400/30 overflow-hidden"
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
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 flex items-center justify-center shadow-xl ring-2 ring-white/50 ring-offset-2 ring-offset-purple-900">
                    <UserCircleIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                  </div>
                </motion.div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="font-poppins font-bold text-sm sm:text-base text-white truncate drop-shadow-lg">
                      {userData.name}
                    </h3>
                    <p className="text-xs text-purple-300 font-medium truncate flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      {userData.email}
                    </p>
                  </motion.div>
                </div>

                {/* Chevron Icon */}
                <motion.div
                  animate={{ rotate: isProfileOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-purple-700/50 p-2 rounded-lg"
                >
                  <ChevronDownIcon className="w-4 h-4 text-purple-200" />
                </motion.div>
              </motion.div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-3 border-t border-purple-400/30">
                      {/* Logout Button */}
                      <motion.button
                        whileHover={{ 
                          scale: 1.03,
                          boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          handleLogout();
                          if (window.innerWidth < 640) setIsSidebarOpen(false);
                        }}
                        className="relative w-full px-4 py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white rounded-xl font-poppins font-bold text-sm flex items-center justify-center gap-2 shadow-lg overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-red-700"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                        />
                        <ArrowLeftOnRectangleIcon className="relative z-10 w-5 h-5" />
                        <span className="relative z-10">Sign Out</span>
                      </motion.button>

                      {/* Additional Info */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="px-3 py-2 bg-purple-900/40 rounded-lg border border-purple-400/20"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-300">Status:</span>
                          <span className="flex items-center gap-1 text-green-400 font-semibold">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Active
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;