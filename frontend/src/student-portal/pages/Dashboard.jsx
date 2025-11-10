import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import UniversityInfo from '../components/UniversityInfo';
import WelcomeSection from '../components/WelcomeSection';
import ProgramsTable from '../components/ProgramsTable';
import Guidelines from '../components/Guidelines';
import Prospectus from '../components/Prospectus';
import Applications from '../components/Applications';
import Payment from '../components/Payment';
import Footer from '../components/Footer';
import InstructionsModal from '../components/InstructionsModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ email: '', name: 'User' });
  const [applications, setApplications] = useState({
    active: [],
    opened: [],
    closed: [],
  });
  const [deadline, setDeadline] = useState('June 30, 2025');
  const [applicationStatus, setApplicationStatus] = useState('OPEN');
  const [openingDate, setOpeningDate] = useState(null);
  const [closingDate, setClosingDate] = useState(null);
  const [isApplicationOpen, setIsApplicationOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch application settings (status, opening/closing dates)
  const fetchApplicationSettings = async (silent = false) => {
    try {
      const res = await axios.get('http://localhost:8000/api/application-settings/');
      if (res.data && res.data.length > 0) {
        const settings = res.data[0];
        const isOpen = settings.status === 'OPEN' && settings.is_open && !settings.is_close;
        
        setApplicationStatus(settings.status);
        setOpeningDate(settings.opening_date);
        setClosingDate(settings.closing_date);
        setIsApplicationOpen(isOpen);

        // Detect status changes and notify user (only if not silent)
        if (!silent) {
          if (isOpen !== isApplicationOpen) {
            if (isOpen) {
              toast.success('🎉 Applications are now OPEN!', { duration: 5000 });
            } else {
              toast.error('⚠️ Applications are now CLOSED', { duration: 5000 });
            }
          }
        }
      }
    } catch (err) {
      if (!silent) {
        console.error('Error fetching application settings:', err);
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again.');
        navigate('/student/login');
        return;
      }
      try {
        const res = await axios.get('http://localhost:8000/api/user-profile/', {
          headers: { Authorization: `Token ${token}` },
        });
        if (res.data.status === 'success' && res.data.data) {
          setUserData({
            email: res.data.data.email || 'user@example.com',
            name: res.data.data.name || 'User',
          });
        } else {
          toast.error('Invalid user data received.');
        }
      } catch (err) {
        toast.error('Error fetching user data.');
        console.error(err.response?.data || err.message);
      }
    };

    fetchUserData();
    fetchApplicationSettings(); // Initial fetch
  }, [navigate]);

  // Silent auto-refresh every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchApplicationSettings(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isApplicationOpen]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchApplicationSettings(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchApplicationSettings(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsSidebarOpen(window.innerWidth >= 768 ? true : false);
      }, 100);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    setTimeout(() => navigate('/student/login'), 1500);
  };

  const handleNewApplication = () => {
    setIsModalOpen(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    navigate('/student/application/page1');
  };

  const handleOpenApplication = (appId) => {
    navigate(`/application/page1?appId=${appId}`);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    console.log('Toggle clicked, isSidebarOpen:', !isSidebarOpen);
    setIsSidebarOpen((prev) => !prev);
  };

  const programs = [
    { category: 'Undergraduate', name: 'B.A. English', duration: '3 Years' },
    { category: 'Undergraduate', name: 'B.Com.', duration: '3 Years' },
    { category: 'Postgraduate', name: 'M.A. English', duration: '2 Years' },
    { category: 'Postgraduate', name: 'M.A. History', duration: '2 Years' },
    { category: 'Postgraduate', name: 'MBA', duration: '2 Years' },
    { category: 'Postgraduate', name: 'M.Com.', duration: '2 Years' },
    { category: 'Postgraduate', name: 'M.Sc. Mathematics', duration: '2 Years' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            <UniversityInfo />
            <WelcomeSection 
              deadline={deadline} 
              handleNewApplication={handleNewApplication}
              isApplicationOpen={isApplicationOpen}
              applicationStatus={applicationStatus}
              openingDate={openingDate}
              closingDate={closingDate}
            />
          </>
        );
      case 'newApplication':
        return (
          <WelcomeSection
            deadline={deadline}
            handleNewApplication={handleNewApplication}
            isApplicationOpen={isApplicationOpen}
            applicationStatus={applicationStatus}
            openingDate={openingDate}
            closingDate={closingDate}
            title="Start a New Application"
            description="Begin your journey with Periyar University by applying for the 2025-2026 Academic Year."
          />
        );
      case 'programs':
        return <ProgramsTable programs={programs} />;
      case 'guidelines':
        return <Guidelines />;
      case 'prospectus':
        return <Prospectus />;
      case 'applications':
        return <Applications applications={applications} handleOpenApplication={handleOpenApplication} />;
      case 'payment':
        return <Payment />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 overflow-x-hidden relative flex flex-col">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>

      <div className="relative z-10 flex-1">
        {/* Hamburger Toggle Button for Mobile */}
        <motion.button
          className="md:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-300 animate-neon-glow pointer-events-auto"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.2, rotate: 360 }}
          whileTap={{ scale: 0.8, transition: { type: 'spring', stiffness: 300 } }}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M4 6H20"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              animate={isSidebarOpen ? { d: 'M6 6L18 18' } : { d: 'M4 6H20' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
            <motion.path
              d="M4 12H20"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              animate={isSidebarOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
            <motion.path
              d="M4 18H20"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              animate={isSidebarOpen ? { d: 'M6 18L18 6' } : { d: 'M4 18H20' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </svg>
        </motion.button>

        {/* Overlay for Mobile when Sidebar is Open */}
        <AnimatePresence>
          {isSidebarOpen && window.innerWidth < 768 && (
            <motion.div
              className="fixed inset-0 bg-black/70 z-30 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                console.log('Overlay clicked, closing sidebar');
                setIsSidebarOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        <div className="flex min-h-screen">
          {/* Sidebar */}
          <motion.div
            className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-40 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}
            initial={{ x: '-100%' }}
            animate={{ x: isSidebarOpen ? 0 : '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              userData={userData}
              isProfileOpen={isProfileOpen}
              setIsProfileOpen={setIsProfileOpen}
              handleLogout={handleLogout}
              handleNewApplication={handleNewApplication}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </motion.div>

          {/* Main Content */}
          <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 pt-20 md:pt-6 z-20 overflow-y-auto scrollbar">
            <div className="max-w-5xl mx-auto">
              {renderContent()}
            </div>
            <footer className="mt-8 w-full max-w-5xl mx-auto border-t border-gray-200 pt-4">
              <Footer />
            </footer>
          </main>
        </div>
      </div>

      <InstructionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
      />

      <Toaster position="top-right" />
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        .font-roboto {
          font-family: 'Roboto', sans-serif !important;
        }
        .font-inter {
          font-family: 'Inter', sans-serif !important;
        }
        .font-poppins {
          font-family: 'Poppins', sans-serif !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }
        .font-lato {
          font-family: 'Lato', sans-serif !important;
          text-shadow: 0 1px 2px rgba(0, 102, 0, 0.3);
        }
        .relative {
          z-index: 10 !important;
        }
        .border-gradient {
          border-image: linear-gradient(to right, rgba(139,0,139, 0.7), rgba(167, 139, 250, 0.7)) 1;
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(167, 139, 250, 0.7);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
          animation: float 4s infinite ease-in-out;
        }
        .particle-1 {
          width: 12px;
          height: 12px;
          top: 10%;
          left: 20%;
          animation-delay: 0s;
        }
        .particle-2 {
          width: 10px;
          height: 10px;
          top: 30%;
          left: 70%;
          animation-delay: 1s;
        }
        .particle-3 {
          width: 14px;
          height: 14px;
          top: 60%;
          left: 30%;
          animation-delay: 2s;
        }
        .particle-4 {
          width: 11px;
          height: 11px;
          top: 20%;
          left: 80%;
          animation-delay: 3s;
        }
        .particle-5 {
          width: 10px;
          height: 10px;
          top: 50%;
          left: 40%;
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-10px) translateX(6px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.9; box-shadow: 0 0 10px rgba(167, 139, 250, 0.5); }
          50% { opacity: 1; box-shadow: 0 0 20px rgba(167, 139, 250, 0.8); }
        }
        .animate-glow {
          animation: glow 1.5s ease-in-out infinite;
        }
        @keyframes neon-glow {
          0% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), 0 0 30px rgba(99, 102, 241, 0.2); }
          50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.5), 0 0 40px rgba(99, 102, 241, 0.4); }
          100% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), 0 0 30px rgba(99, 102, 241, 0.2); }
        }
        .animate-neon-glow {
          animation: neon-glow 1.8s ease-in-out infinite;
        }
        @keyframes waveSlow {
          0% { background-position: 0 bottom; }
          50% { background-position: 1440px bottom; }
          100% { background-position: 2880px bottom; }
        }
        .animate-wave-slow {
          animation: waveSlow 12s linear infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
        .scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
        }
        .scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }
        .scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8);
        }
        /* Responsive adjustments */
        @media (min-width: 768px) {
          main {
            margin-left: 272px; /* 256px sidebar + 16px gap */
            width: calc(100% - 272px); /* Occupy remaining space after sidebar and gap */
          }
        }
        @media (max-width: 767px) {
          main {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;