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
  const cardGradient = isApplicationOpen 
    ? 'from-green-700 to-emerald-700' 
    : 'from-red-700 to-rose-700';

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
      className={`relative bg-gradient-to-r ${cardGradient} rounded-2xl text-white shadow-2xl p-8 mb-6 overflow-hidden w-full max-w-5xl mx-auto`}
      whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 320%22%3E%3Cpath fill=%22%23ffffff%22 fill-opacity=%220.1%22 d=%22M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z%22%3E%3C/path%3E%3C/svg%3E')] bg-bottom bg-no-repeat animate-wave-slow" />
      <div className="relative z-10 text-center">
        {/* Status Badge */}
        <div className="flex justify-center mb-4">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
            isApplicationOpen 
              ? 'bg-green-500/20 text-green-100 border-2 border-green-300' 
              : 'bg-red-500/20 text-red-100 border-2 border-red-300'
          }`}>
            {isApplicationOpen ? (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Applications OPEN
              </>
            ) : (
              <>
                <XCircleIcon className="h-5 w-5 mr-2" />
                Applications CLOSED
              </>
            )}
          </span>
        </div>

        <h2 className="text-3xl font-bold font-poppins text-white mb-4 tracking-tight">
          {title}
        </h2>
        <p className="text-lg font-lato font-normal text-white/90 mb-6">
          {description}
        </p>

        {/* Application Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-center text-white/80 mb-2">
              <CalendarIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-semibold">Opening Date</span>
            </div>
            <p className="text-lg font-bold text-white">
              {formatDate(openingDate)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-center text-white/80 mb-2">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-semibold">Closing Date</span>
            </div>
            <p className="text-lg font-bold text-white">
              {formatDate(closingDate)}
            </p>
          </div>
        </div>

        {/* Application Button or Closed Message */}
        {isApplicationOpen ? (
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(255, 255, 255, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewApplication}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-white to-green-100 text-green-900 rounded-xl hover:bg-green-200 transition duration-300 flex items-center justify-center mx-auto font-lato font-semibold text-base shadow-lg border border-white/20"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Start New Application
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </motion.button>
        ) : (
          <div className="mt-4 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/30 max-w-md mx-auto">
            <p className="text-white font-semibold text-base flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 mr-2" />
              Applications are currently closed
            </p>
            <p className="text-white/80 text-sm mt-2">
              Please check back when applications reopen
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default WelcomeSection;