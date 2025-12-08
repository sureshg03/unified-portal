import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowRightIcon, ClockIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';

const WelcomeSection = ({
  deadline,
  handleNewApplication,
  isApplicationOpen = true,
  applicationStatus = 'OPEN',
  openingDate = null,
  closingDate = null,
  title = "Welcome to Online Education",
  description = "Apply for the 2025-2026 Academic Year"
}) => {

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Determine card color based on status
  // Professional, formal gradients for open/closed states
  const cardGradient = isApplicationOpen
    ? 'from-emerald-900 via-emerald-800 to-emerald-700'
    : 'from-rose-900 via-rose-800 to-rose-700';

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
      className={`relative bg-gradient-to-br ${cardGradient} rounded-2xl text-white shadow-2xl overflow-hidden w-full max-w-6xl mx-auto mb-8`}
      whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
    >
      <style>
        {`
          @keyframes wave {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-25%); }
          }
          .animate-wave-slow {
            animation: wave 20s ease-in-out infinite;
          }
        `}
      </style>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 320%22%3E%3Cpath fill=%22%23ffffff%22 fill-opacity=%220.1%22 d=%22M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z%22%3E%3C/path%3E%3C/svg%3E')] bg-bottom bg-no-repeat animate-wave-slow" />

      <div className="relative z-10 px-8 py-10">
        {/* Status Badge - Top Center */}
        <div className="flex justify-center mb-6">
          <motion.span
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
            className={`inline-flex items-center px-6 py-3 rounded-full text-base font-bold shadow-lg ${isApplicationOpen
              ? 'bg-white text-green-700 border-2 border-green-200'
              : 'bg-white text-red-700 border-2 border-red-200'
              }`}
          >
            {isApplicationOpen ? (
              <>
                <CheckCircleIcon className="h-6 w-6 mr-2" />
                Applications OPEN
              </>
            ) : (
              <>
                <XCircleIcon className="h-6 w-6 mr-2" />
                Applications CLOSED
              </>
            )}
          </motion.span>
        </div>

        {/* Title and Description - Centered */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins text-white mb-4 tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-xl md:text-2xl font-lato font-medium text-white/95 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        {/* Application Dates - Improved Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/15 backdrop-blur-md rounded-xl p-6 border-2 border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-center text-white mb-3">
              <CalendarIcon className="h-6 w-6 mr-3" />
              <span className="text-base font-bold uppercase tracking-wide">Opening Date</span>
            </div>
            <p className="text-2xl font-bold text-white text-center">
              {formatDate(openingDate)}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/15 backdrop-blur-md rounded-xl p-6 border-2 border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-center text-white mb-3">
              <ClockIcon className="h-6 w-6 mr-3" />
              <span className="text-base font-bold uppercase tracking-wide">Closing Date</span>
            </div>
            <p className="text-2xl font-bold text-white text-center">
              {formatDate(closingDate)}
            </p>
          </motion.div>
        </div>

        {/* Application Button or Closed Message - Centered */}
        <div className="flex justify-center">
          {isApplicationOpen ? (
            <motion.button
              whileHover={{ scale: 1.08, boxShadow: '0 10px 40px rgba(255, 255, 255, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewApplication}
              className="px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all duration-300 flex items-center justify-center font-lato font-bold text-lg shadow-2xl border-2 border-white/50"
            >
              <SparklesIcon className="h-6 w-6 mr-3" />
              Start New Application
              <ArrowRightIcon className="h-6 w-6 ml-3" />
            </motion.button>
          ) : (
            <div className="px-8 py-6 bg-white/15 backdrop-blur-md rounded-xl border-2 border-white/40 max-w-lg shadow-lg">
              <p className="text-white font-bold text-lg flex items-center justify-center mb-2">
                <XCircleIcon className="h-7 w-7 mr-3" />
                Applications are currently closed
              </p>
              <p className="text-white/90 text-base text-center">
                Please check back when applications reopen
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default WelcomeSection;