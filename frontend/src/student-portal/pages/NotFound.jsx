import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(-1); // Go back instead of dashboard
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center overflow-hidden relative"
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Animated 404 Text */}
        <div className="relative mb-4 mt-8">
          <h1 className="text-[140px] md:text-[180px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 leading-[0.9] animate-gradient-x select-none">
            404
          </h1>
          
          {/* Floating Elements */}
          <div className="absolute top-0 left-1/4 animate-float">
            <svg className="w-16 h-16 text-purple-500 opacity-60" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </div>
          
          <div className="absolute bottom-10 right-1/4 animate-float animation-delay-2000">
            <svg className="w-12 h-12 text-pink-500 opacity-60" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Animated Box Illustration */}
        <div className="mb-6 relative">
          <div className="inline-block animate-bounce-slow">
            {/* Box SVG */}
            <svg className="w-48 h-48 mx-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Shadow */}
              <ellipse cx="100" cy="180" rx="60" ry="8" fill="#CBD5E0" opacity="0.3" className="animate-pulse" />
              
              {/* Box Body */}
              <path d="M50 80 L100 60 L150 80 L150 140 L100 160 L50 140 Z" fill="#F59E0B" className="animate-pulse-slow" />
              <path d="M50 80 L100 100 L150 80 L100 60 Z" fill="#FBBF24" />
              <path d="M100 100 L100 160 L150 140 L150 80 Z" fill="#F59E0B" opacity="0.8" />
              <path d="M50 80 L50 140 L100 160 L100 100 Z" fill="#D97706" />
              
              {/* Box Lines */}
              <line x1="100" y1="60" x2="100" y2="100" stroke="#92400E" strokeWidth="2" strokeDasharray="5,5" className="animate-dash" />
              <line x1="75" y1="70" x2="75" y2="120" stroke="#92400E" strokeWidth="1.5" opacity="0.6" />
              <line x1="125" y1="70" x2="125" y2="120" stroke="#92400E" strokeWidth="1.5" opacity="0.6" />
              
              {/* Question Mark Dots */}
              <circle cx="80" cy="90" r="3" fill="white" className="animate-ping-slow" />
              <circle cx="100" cy="85" r="3" fill="white" className="animate-ping-slow animation-delay-1000" />
              <circle cx="120" cy="90" r="3" fill="white" className="animate-ping-slow animation-delay-2000" />
            </svg>
          </div>
          
          {/* Floating Icons Around Box */}
          <div className="absolute top-0 left-1/3 animate-float-reverse">
            <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          
          <div className="absolute bottom-0 right-1/3 animate-spin-slow">
            <svg className="w-10 h-10 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed animate-fade-in">
            Oops! Page Not Found
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed animate-fade-in animation-delay-500">
            The page you're trying to access in the Periyar University CDOE portal does not exist or has been moved.
            Please use the button below to return to your previous page.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-6 animate-fade-in animation-delay-1000">
          <div className="inline-flex items-center space-x-3 bg-white rounded-full px-6 py-3 shadow-xl border-2 border-purple-300 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <svg className="w-5 h-5 text-purple-600 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700 font-medium text-sm leading-normal">
              Auto redirecting in <span className="text-lg font-bold text-purple-600 mx-1">{countdown}</span> sec
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center items-center animate-fade-in animation-delay-1500">
          <button
            onClick={() => navigate(-1)}
            className="group relative px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-purple-700 overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-2 text-base leading-normal">
              <svg className="w-5 h-5 group-hover:rotate-[-10deg] transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Take Me Back</span>
            </span>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 space-y-2 animate-fade-in animation-delay-2000">
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            <span className="text-purple-700 font-bold">Periyar University</span> - Centre for Distance and Online Education (CDOE)
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Need assistance? Contact CDOE Support:{' '}
            <a href="mailto:cdoe@periyaruniversity.ac.in" className="text-purple-600 hover:text-purple-800 font-semibold underline transition-colors">
              cdoe@periyaruniversity.ac.in
            </a>
          </p>
          <p className="text-xs text-gray-400 leading-normal">
            Salem - 636011, Tamil Nadu, India | NAAC 'A+' Grade - NIRF Rank 94
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        /* Remove scrollbars globally */
        body, html {
          overflow: hidden !important;
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-reverse {
          0%, 100% {
            transform: translateY(-20px);
          }
          50% {
            transform: translateY(0px);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-30px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes dash {
          0% {
            stroke-dashoffset: 10;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: float-reverse 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-dash {
          animation: dash 2s linear infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-1500 {
          animation-delay: 1.5s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
