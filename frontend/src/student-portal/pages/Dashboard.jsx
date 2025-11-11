import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  SparklesIcon,
  ChartBarIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
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
import ApplicationProgress from '../components/ApplicationProgress';
import PaymentHistory from './PaymentHistory';
import ApplicationDownloadDashboard from '../components/ApplicationDownloadDashboard';

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
  const [isPaid, setIsPaid] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // Fetch payment status
  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        'http://localhost:8000/api/application-payment-data/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        const paymentStatus = response.data.data.application.payment_status;
        setIsPaid(paymentStatus === 'P');
        setPaymentData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
      // If no application exists yet, that's fine
      setIsPaid(false);
    }
  };

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
    fetchPaymentStatus(); // Fetch payment status
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
            {isPaid ? (
              <div className="mt-6 space-y-6">
                {/* Hero Welcome Card */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-700 to-purple-700 rounded-2xl shadow-2xl border border-purple-400/20"
                >
                  <div className="absolute inset-0 bg-black/5"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
                  
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                          Welcome back, {userData.name}! 
                        </h1>
                        <p className="text-base md:text-lg text-indigo-100">
                          Your application is in progress
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center shadow-lg">
                            <CheckCircleIcon className="h-6 w-6 text-green-200" />
                          </div>
                          <div>
                            <p className="text-xs text-green-100 uppercase tracking-wider font-medium mb-0.5">Application</p>
                            <p className="text-base md:text-lg font-semibold text-white">Submitted</p>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center shadow-lg">
                            <ClockIcon className="h-6 w-6 text-blue-200" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-100 uppercase tracking-wider font-medium mb-0.5">Status</p>
                            <p className="text-base md:text-lg font-semibold text-white">Under Review</p>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center shadow-lg">
                            <DocumentTextIcon className="h-6 w-6 text-purple-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-purple-100 uppercase tracking-wider font-medium mb-0.5">App ID</p>
                            <p className="text-sm md:text-base font-mono font-semibold text-white truncate">
                              {paymentData?.application?.application_id || 'Processing...'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.03, y: -8 }}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-violet-100"
                    onClick={() => setActiveSection('applicationProgress')}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-purple-600"></div>
                    <div className="p-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                        <ChartBarIcon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">Track Progress</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
                        View your application verification status and timeline
                      </p>
                      <div className="flex items-center text-violet-600 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>View Status</span>
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.03, y: -8 }}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-blue-100"
                    onClick={() => setActiveSection('applicationDownload')}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-cyan-600"></div>
                    <div className="p-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                        <ArrowDownTrayIcon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Download Form</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
                        Get your completed application form in PDF format
                      </p>
                      <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>Download Now</span>
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.03, y: -8 }}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-green-100"
                    onClick={() => setActiveSection('paymentHistory')}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"></div>
                    <div className="p-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                        <BanknotesIcon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Payment Details</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
                        View your payment history and download receipt
                      </p>
                      <div className="flex items-center text-green-600 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>View History</span>
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Next Steps Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl shadow-xl border border-amber-300/50 p-6 md:p-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <RocketLaunchIcon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          Next Steps
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">Important</span>
                        </h3>
                        <ul className="space-y-3 text-sm md:text-base text-gray-700 leading-relaxed">
                          <li className="flex items-start gap-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <span>Track your application progress from the sidebar menu</span>
                          </li>
                          <li className="flex items-start gap-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            <span>Download your application form for your records</span>
                          </li>
                          <li className="flex items-start gap-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            <span>Wait for document verification by college staff</span>
                          </li>
                          <li className="flex items-start gap-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                            <span>Check your email regularly for updates</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <WelcomeSection 
                deadline={deadline} 
                handleNewApplication={handleNewApplication}
                isApplicationOpen={isApplicationOpen}
                applicationStatus={applicationStatus}
                openingDate={openingDate}
                closingDate={closingDate}
              />
            )}
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
      case 'applicationProgress':
        return <ApplicationProgress />;
      case 'applicationDownload':
        return <ApplicationDownloadDashboard />;
      case 'paymentHistory':
        return <PaymentHistory />;
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
              isPaid={isPaid}
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