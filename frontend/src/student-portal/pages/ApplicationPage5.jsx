import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import { ArrowLeftIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon, ClockIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Confetti from 'react-confetti';
import { toast, Toaster } from 'react-hot-toast';
import StepProgressBar from '../components/StepProgressBar';
import PaymentPrintStyle from '../components/PaymentPrintStyle';

const PaymentModal = ({ status, amount, onClose }) => {
  const icons = {
    success: <CheckCircleIcon className="w-16 h-16 text-green-500" />,
    failed: <XCircleIcon className="w-16 h-16 text-red-500" />,
    cancelled: <ClockIcon className="w-16 h-16 text-yellow-500" />,
  };
  const messages = {
    success: 'Payment Successful!',
    failed: 'Payment Failed',
    cancelled: 'Payment Cancelled',
  };
  const colors = {
    success: 'bg-green-50 border-green-200',
    failed: 'bg-red-50 border-red-200',
    cancelled: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
    >
      {status === 'success' && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <motion.div
        className={`bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 ${colors[status]} backdrop-blur-lg`}
        animate={status === 'failed' ? { x: [0, 10, -10, 0] } : {}}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="flex flex-col items-center space-y-4">
          {icons[status]}
          <h3 className="text-2xl font-bold text-gray-800">{messages[status]}</h3>
          <p className="text-lg font-semibold text-gray-600">Amount: ₹{amount.toFixed(2)}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const applicationId = state?.applicationId || localStorage.getItem('application_id');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 23400, // ₹234 in paise
    currency: 'INR',
    order_id: null,
    application_id: applicationId || null,
    transaction_id: null,
    payment_date: null,
  });
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [userData, setUserData] = useState(() => {
    const cached = localStorage.getItem('userData');
    return cached ? JSON.parse(cached) : { email: '', phone: '', name: '' };
  });
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef(null);
  const printRef = useRef(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const retryCount = useRef(0);
  const [applicationData, setApplicationData] = useState(null);
  const [loadingAppData, setLoadingAppData] = useState(false);

  // Preload Razorpay script
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = 'https://checkout.razorpay.com/v1/checkout.js';
    link.as = 'script';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay SDK loaded');
      setScriptLoaded(true);
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      toast.error('Failed to load payment gateway.');
      setIsLoading(false);
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to proceed with payment.');
        navigate('/student/login');
        return;
      }

      if (userData.email && userData.name) {
        setIsLoading(false);
        return;
      }

      try {
        const userResponse = await axios.get('http://localhost:8000/api/student-details/', {
          headers: { Authorization: `Token ${token}` },
        });
        if (userResponse.data.status === 'success' && userResponse.data.data) {
          const data = {
            email: userResponse.data.data.email || '',
            phone: userResponse.data.data.phone || '',
            name: userResponse.data.data.name || 'User',
          };
          setUserData(data);
          localStorage.setItem('userData', JSON.stringify(data));
          setIsLoading(false);
        } else {
          throw new Error('Failed to fetch user data.');
        }
      } catch (error) {
        console.error('Student details error:', error);
        try {
          const profileResponse = await axios.get('http://localhost:8000/api/user-profile/', {
            headers: { Authorization: `Token ${token}` },
          });
          if (profileResponse.data.status === 'success' && profileResponse.data.data) {
            const data = {
              email: profileResponse.data.data.email || '',
              phone: profileResponse.data.data.phone || '',
              name: profileResponse.data.data.name || profileResponse.data.data.username || 'User',
            };
            setUserData(data);
            localStorage.setItem('userData', JSON.stringify(data));
            setIsLoading(false);
          } else {
            throw new Error('Failed to fetch profile data.');
          }
        } catch (profileError) {
          console.error('Profile error:', profileError);
          toast.error('Failed to fetch user data.');
          navigate('/student/login');
        }
      }
    };
    fetchData();
  }, [navigate, userData.email, userData.name]);

  // Fetch order details with retries
  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem('token');
      if (!token || !userData.email || !userData.name || !scriptLoaded || paymentDetails.order_id) {
        return;
      }

      try {
        const orderResponse = await axios.post(
          'http://localhost:8000/api/create-order/',
          { amount: paymentDetails.amount, currency: paymentDetails.currency },
          { headers: { Authorization: `Token ${token}` } }
        );
        if (orderResponse.data.status === 'success' && orderResponse.data.order_id) {
          setPaymentDetails(prev => ({
            ...prev,
            order_id: orderResponse.data.order_id,
            application_id: orderResponse.data.application_id,
          }));
          localStorage.setItem('application_id', orderResponse.data.application_id);
          retryCount.current = 0;
          setIsLoading(false);
        } else {
          throw new Error('Failed to create order.');
        }
      } catch (error) {
        console.error('Order error:', error);
        toast.error('Failed to create payment order.');
        if (retryCount.current < 2) {
          retryCount.current += 1;
          setTimeout(fetchOrder, 1000);
        } else {
          setIsLoading(false);
        }
      }
    };
    fetchOrder();
  }, [userData.email, userData.name, scriptLoaded, paymentDetails.order_id]);

  // Enable animations when card is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimationsEnabled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch application data for printing
  const fetchApplicationData = async () => {
    setLoadingAppData(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const headers = { Authorization: `Token ${token}` };
      const [previewResponse, autofillResponse, page3Response] = await Promise.all([
        axios.get('http://localhost:8000/api/application/preview/', { headers }),
        axios.get('http://localhost:8000/api/get-autofill-application/', { headers }),
        axios.get('http://localhost:8000/api/application/page3/', { headers }),
      ]);

      const combinedData = {
        student: previewResponse.data.data?.student || autofillResponse.data.data || {},
        application: {
          ...previewResponse.data.data?.application,
          ...autofillResponse.data.data,
          id: previewResponse.data.data?.application?.id || autofillResponse.data.data?.id || '',
          mode_of_study: autofillResponse.data.data?.mode_of_study || '',
          programme_applied: autofillResponse.data.data?.programme_applied || '',
          course: autofillResponse.data.data?.course || '',
          medium: autofillResponse.data.data?.medium || '',
          academic_year: autofillResponse.data.data?.academic_year || '',
          deb_id: autofillResponse.data.data?.deb_id || '',
          abc_id: autofillResponse.data.data?.abc_id || '',
          name_as_aadhaar: autofillResponse.data.data?.name_as_aadhaar || '',
          aadhaar_no: autofillResponse.data.data?.aadhaar_no || '',
          dob: autofillResponse.data.data?.dob || '',
          gender: autofillResponse.data.data?.gender || '',
          father_name: autofillResponse.data.data?.father_name || '',
          mother_name: autofillResponse.data.data?.mother_name || '',
          nationality: autofillResponse.data.data?.nationality || '',
          religion: autofillResponse.data.data?.religion || '',
          community: autofillResponse.data.data?.community || '',
          blood_group: autofillResponse.data.data?.blood_group || '',
          comm_district: autofillResponse.data.data?.comm_district || '',
          comm_state: autofillResponse.data.data?.comm_state || '',
          perm_district: autofillResponse.data.data?.perm_district || '',
          perm_state: autofillResponse.data.data?.perm_state || '',
        },
        student_details: {
          ...page3Response.data.data,
          qualifications: page3Response.data.data?.qualifications || [],
          percentage: page3Response.data.data?.percentage || '',
          cgpa: page3Response.data.data?.cgpa || '',
        },
      };

      setApplicationData(combinedData);
      setLoadingAppData(false);
      return true;
    } catch (err) {
      console.error('Failed to fetch application data:', err);
      toast.error('Failed to load application data for printing.');
      setLoadingAppData(false);
      return false;
    }
  };

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Application_Form_${paymentDetails.application_id || 'Pending'}`,
    onBeforeGetContent: async () => {
      if (!applicationData) {
        const success = await fetchApplicationData();
        if (!success) {
          throw new Error('Failed to load application data');
        }
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    },
    onAfterPrint: () => {
      toast.success('Application form printed successfully!');
    },
  });

  const handlePayment = async () => {
    console.log('Handle payment called', { scriptLoaded, order_id: paymentDetails.order_id, userData, application_id: paymentDetails.application_id });

    if (!window.Razorpay || !scriptLoaded || !paymentDetails.order_id || !userData.email || !userData.name || !paymentDetails.application_id) {
      console.error('Payment prerequisites not met', {
        razorpay: !!window.Razorpay,
        scriptLoaded,
        order_id: paymentDetails.order_id,
        email: userData.email,
        name: userData.name,
        application_id: paymentDetails.application_id,
      });
      toast.error('Unable to initiate payment. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const options = {
        key: 'rzp_test_phCnHzNiGNxEc9',
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        name: 'Application Portal',
        description: 'Application Fee Payment',
        image: '/Logo.png',
        order_id: paymentDetails.order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              'http://localhost:8000/api/verify-payment/',
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                application_id: paymentDetails.application_id,
                payment_status: 'success',
              },
              { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
            );
            if (verifyResponse.data.status === 'success') {
              localStorage.setItem('application_id', verifyResponse.data.application_id);
              localStorage.setItem('transaction_id', verifyResponse.data.transaction_id);
              setPaymentDetails(prev => ({
                ...prev,
                transaction_id: verifyResponse.data.transaction_id || response.razorpay_payment_id,
                payment_date: new Date().toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
              }));
              setPaymentStatus('success');
              setShowModal(true);
              toast.success('Payment successful!');
              setTimeout(() => {
                setShowModal(false);
                navigate('/student/application/submitted');
              }, 3000);
            } else {
              setPaymentStatus('failed');
              setShowModal(true);
              toast.error('Payment verification failed.');
              setTimeout(() => setShowModal(false), 3000);
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            setPaymentStatus('failed');
            setShowModal(true);
            toast.error('Payment verification failed.');
            setTimeout(() => setShowModal(false), 3000);
          }
          setIsProcessing(false);
        },
        prefill: {
          name: userData.name,
          email: userData.email,
          contact: userData.phone || '',
        },
        theme: {
          color: '#7C3AED',
        },
        modal: {
          ondismiss: async () => {
            console.log('Payment modal dismissed', { application_id: paymentDetails.application_id });
            try {
              await axios.post(
                'http://localhost:8000/api/verify-payment/',
                {
                  razorpay_payment_id: `CANCELLED-${Date.now()}`,
                  razorpay_order_id: paymentDetails.order_id,
                  application_id: paymentDetails.application_id,
                  payment_status: 'cancelled',
                },
                { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
              );
              setPaymentStatus('cancelled');
              setShowModal(true);
              toast.error('Payment cancelled.');
              setTimeout(() => {
                setShowModal(false);
                navigate('/student/application/page5');
              }, 3000);
            } catch (error) {
              console.error('Failed to record cancelled payment:', error);
              setPaymentStatus('cancelled');
              setShowModal(true);
              setTimeout(() => setShowModal(false), 3000);
            }
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on('payment.failed', async function (response) {
        console.error('Payment failed:', response.error);
        try {
          await axios.post(
            'http://localhost:8000/api/verify-payment/',
            {
              razorpay_payment_id: response.error.metadata.payment_id || `FAILED-${Date.now()}`,
              razorpay_order_id: paymentDetails.order_id,
              application_id: paymentDetails.application_id,
              payment_status: 'failed',
            },
            { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
          );
          setPaymentStatus('failed');
          setShowModal(true);
          toast.error('Payment failed.');
          setTimeout(() => setShowModal(false), 3000);
        } catch (error) {
          console.error('Failed to record failed payment:', error);
          toast.error('Failed to record payment failure.');
          setPaymentStatus('failed');
          setShowModal(true);
          setTimeout(() => setShowModal(false), 3000);
        }
        setIsProcessing(false);
      });
    } catch (error) {
      console.error('Payment initialization error:', error.message);
      toast.error('Failed to initialize payment.');
      setPaymentStatus('error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <PaymentPrintStyle />
      <Toaster position="top-right" />
      <style>
        {`
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.3); }
            50% { box-shadow: 0 0 25px rgba(124, 58, 237, 0.5); }
          }
          .animate-glow { animation: glow 2.5s ease-in-out infinite; }
          .animate-wave {
            background: radial-gradient(circle at 30% 30%, rgba(248, 215, 215, 0.2), transparent 50%),
                        linear-gradient(135deg, #4B0082 0%, #6B21A8 50%, #DB2777 100%);
            background-size: 200% 200%;
            animation: wave 6s ease-in-out infinite;
          }
          .payment-card {
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAADBJREFUeAFjZGBg+M+AAoYgJgyMjo7OAP4zMDAwMTAwsP///z8gYGBgYGD4z4ABAACvMQEBjL9G3gAAAABJRU5ErkJggg==') repeat,
                        linear-gradient(135deg, #4B0082 0%, #6B21A8 50%, #DB2777 100%);
            background-blend-mode: overlay;
            position: relative;
            overflow: hidden;
          }
          .holographic {
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%);
            background-size: 200% 200%;
            animation: wave 8s ease-in-out infinite;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.2;
            pointer-events: none;
          }
          @media (max-width: 640px) {
            .payment-card { padding: 6px; }
            .payment-button, .back-button { padding: 10px 16px; font-size: 0.9rem; }
            .payment-button svg, .back-button svg { height: 18px; width: 18px; }
            .payment-icons img { height: 40px; width: 40px; }
            .amount-text { font-size: 2.5rem; }
            .secure-badge { top: 5px; padding: 6px 12px; font-size: 0.85rem; }
            .secure-badge svg { height: 16px; width: 16px; }
          }
        `}
      </style>
      <div className="max-w-6xl mx-auto">
        <StepProgressBar currentStep="/application/page6" />
        {isLoading && (
          <motion.div
            className="text-center text-gray-600 font-medium p-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Loading payment details...
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-purple-200/30"
        >
          <h2 className="text-4xl font-extrabold text-indigo-900 mb-6 text-center font-sans tracking-wide">
            Complete Your Application Payment
          </h2>
          <p className="text-gray-600 text-lg text-center mb-8 font-medium">
            Securely pay the application fee of <span className="font-bold text-indigo-700">₹234.00</span> to finalize your submission.
          </p>

          <motion.div
            ref={cardRef}
            className="relative payment-card p-8 rounded-2xl shadow-[0_10px_40px_rgba(75,0,130,0.3)] border border-white/20 overflow-hidden backdrop-blur-lg animate-glow animate-wave"
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="holographic" />
            {animationsEnabled && (
              <>
                <div className="absolute top-4 left-4 w-3 h-3 bg-white/40 rounded-full animate-pulse" />
                <div className="absolute bottom-8 right-8 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
              </>
            )}
            <div className="relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="flex-shrink-0 relative"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src="/Logo.png"
                      alt="Logo"
                      className="h-14 w-14 object-contain rounded-full border-2 border-white/40 shadow-lg animate-pulse"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 to-transparent opacity-50" />
                  </motion.div>
                  <div>
                    <motion.span
                      className="text-5xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200 tracking-tight amount-text"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ₹234.00
                    </motion.span>
                    <p className="text-sm text-white/90 mt-1 font-semibold">Application Fee</p>
                  </div>
                </div>
                <motion.div
                  className="flex items-center mb-12 mr-12 space-x-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-5 py-2 rounded-full shadow-lg border border-white/30 backdrop-blur-sm secure-badge"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.104-.896-2-2-2H4c-1.104 0-2 .896-2 2v7c0 1.104.896 2 2 2h6c1.104 0 2-.896 2-2v-7zm0 0v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  </svg>
                  <span className="text-sm font-semibold text-white tracking-tight">Secured by Razorpay</span>
                </motion.div>
              </div>
              <div className="flex items-center justify-center space-x-8 mt-6 payment-icons">
                <motion.img
                  src="https://img.icons8.com/color/48/000000/visa.png"
                  alt="Visa"
                  className="h-12 w-12 object-contain filter drop-shadow-md"
                  whileHover={{ y: -6, rotate: 8, filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))' }}
                  transition={{ duration: 0.3 }}
                />
                <motion.img
                  src="https://img.icons8.com/color/48/000000/mastercard.png"
                  alt="Mastercard"
                  className="h-12 w-12 object-contain filter drop-shadow-md"
                  whileHover={{ y: -6, rotate: 8, filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))' }}
                  transition={{ duration: 0.3 }}
                />
                <motion.img
                  src="https://img.icons8.com/color/48/000000/amex.png"
                  alt="Amex"
                  className="h-12 w-12 object-contain filter drop-shadow-md"
                  whileHover={{ y: -6, rotate: 8, filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <motion.p
                className="text-center text-white/90 text-sm mt-6 font-semibold tracking-wide"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Your payment is protected with <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">256-bit encryption</span>
              </motion.p>
            </div>
            <motion.div
              className="absolute top-9 right-6 w-12 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-md shadow-inner border border-white/40"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute bottom-6 left-8 text-white/70 text-sm font-mono tracking-wider"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              XXXX XXXX XXXX XXXX
            </motion.div>
          </motion.div>
          <div className="flex justify-between items-center mt-8 flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(75,85,99,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/student/application/page4')}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl shadow-lg flex items-center space-x-2 transition duration-300 relative overflow-hidden back-button no-print"
              disabled={isProcessing}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-30 transition-opacity duration-500" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              disabled={loadingAppData}
              className={`px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg flex items-center space-x-2 transition duration-300 relative overflow-hidden no-print ${
                loadingAppData ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loadingAppData ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <PrinterIcon className="h-5 w-5" />
                  <span>Print Application</span>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-30 transition-opacity duration-500" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(124,58,237,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePayment}
              className={`px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg flex items-center space-x-2 transition duration-300 relative overflow-hidden payment-button ${
                isProcessing || !scriptLoaded || !paymentDetails.order_id || !userData.email || !userData.name || !paymentDetails.application_id
                  ? 'opacity-50 cursor-not-allowed bg-gradient-to-r from-gray-400 to-gray-500'
                  : 'hover:from-indigo-700 hover:to-purple-700'
              }`}
              disabled={isProcessing || !scriptLoaded || !paymentDetails.order_id || !userData.email || !userData.name || !paymentDetails.application_id}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5" />
                  <span>Pay Now</span>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-30 transition-opacity duration-500" />
            </motion.button>
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {showModal && (
          <PaymentModal
            status={paymentStatus}
            amount={paymentDetails.amount / 100}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Hidden Printable Application Form */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="print-receipt">
          {applicationData ? (
            <>
              <div className="receipt-watermark">APPLICATION</div>
          
          <div className="receipt-header page-break-avoid">
            <img src="/Logo.png" alt="Logo" className="print-logo" />
            <h1>Periyar University</h1>
            <p>Centre for Distance and Online Education (CDOE)</p>
            <p>Salem-636 011, Tamil Nadu, India</p>
            <p>Phone: +91-427-2345766 | Email: cdoe@periyaruniversity.ac.in</p>
          </div>

          <div className="receipt-title page-break-avoid">
            Application for Admission
          </div>

          {/* Personal Details Section */}
          <div className="transaction-box page-break-avoid">
            <h3>Personal Details</h3>
            <table className="payment-details-table">
              <tbody>
                <tr>
                  <th>Application ID</th>
                  <td>{paymentDetails.application_id || applicationData.application?.id || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Name</th>
                  <td>{applicationData.student?.name || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>{applicationData.student?.email || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Phone</th>
                  <td>{applicationData.student?.phone || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Name as per Aadhaar</th>
                  <td>{applicationData.application?.name_as_aadhaar || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Aadhaar Number</th>
                  <td>{applicationData.application?.aadhaar_no || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Date of Birth</th>
                  <td>{applicationData.application?.dob || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Gender</th>
                  <td>{applicationData.application?.gender || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Father's Name</th>
                  <td>{applicationData.application?.father_name || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Mother's Name</th>
                  <td>{applicationData.application?.mother_name || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Nationality</th>
                  <td>{applicationData.application?.nationality || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Religion</th>
                  <td>{applicationData.application?.religion || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Community</th>
                  <td>{applicationData.application?.community || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Blood Group</th>
                  <td>{applicationData.application?.blood_group || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Application Details Section */}
          <div className="transaction-box page-break-avoid">
            <h3>Application Details</h3>
            <table className="payment-details-table">
              <tbody>
                <tr>
                  <th>Mode of Study</th>
                  <td>{applicationData.application?.mode_of_study || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Programme Applied</th>
                  <td>{applicationData.application?.programme_applied || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Course</th>
                  <td>{applicationData.application?.course || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Medium</th>
                  <td>{applicationData.application?.medium || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Academic Year</th>
                  <td>{applicationData.application?.academic_year || 'N/A'}</td>
                </tr>
                <tr>
                  <th>DEB ID</th>
                  <td>{applicationData.application?.deb_id || 'N/A'}</td>
                </tr>
                <tr>
                  <th>ABC ID</th>
                  <td>{applicationData.application?.abc_id || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Educational Qualifications Section */}
          {applicationData.student_details?.qualifications?.length > 0 && (
            <div className="transaction-box page-break-avoid">
              <h3>Educational Qualifications</h3>
              {applicationData.student_details.qualifications.map((qual, index) => (
                <div key={index} style={{ marginBottom: '15px', borderBottom: index < applicationData.student_details.qualifications.length - 1 ? '1px solid #ccc' : 'none', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8px' }}>Qualification {index + 1}</h4>
                  <table className="payment-details-table">
                    <tbody>
                      <tr>
                        <th>Course</th>
                        <td>{qual.course || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Institute</th>
                        <td>{qual.institute_name || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Board</th>
                        <td>{qual.board || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Percentage</th>
                        <td>{qual.percentage || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Month/Year</th>
                        <td>{qual.month_year || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
              <table className="payment-details-table">
                <tbody>
                  <tr>
                    <th>Overall Percentage</th>
                    <td>{applicationData.student_details?.percentage || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>CGPA</th>
                    <td>{applicationData.student_details?.cgpa || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Address Details Section */}
          <div className="transaction-box page-break-avoid">
            <h3>Address Details</h3>
            <table className="payment-details-table">
              <tbody>
                <tr>
                  <th>Communication District</th>
                  <td>{applicationData.application?.comm_district || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Communication State</th>
                  <td>{applicationData.application?.comm_state || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Permanent District</th>
                  <td>{applicationData.application?.perm_district || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Permanent State</th>
                  <td>{applicationData.application?.perm_state || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Details Section */}
          <div className="transaction-box page-break-avoid">
            <h3>Payment Details</h3>
            <table className="payment-details-table">
              <tbody>
                <tr>
                  <th>Transaction ID</th>
                  <td>{paymentDetails.transaction_id || 'Pending'}</td>
                </tr>
                <tr>
                  <th>Order ID</th>
                  <td>{paymentDetails.order_id || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Payment Date</th>
                  <td>{paymentDetails.payment_date || new Date().toLocaleString('en-IN', { 
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
                <tr>
                  <th>Payment Method</th>
                  <td>Online Payment (Razorpay)</td>
                </tr>
                <tr>
                  <th>Amount Paid</th>
                  <td><strong>₹{(paymentDetails.amount / 100).toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <th>Payment Status</th>
                  <td>
                    <span className={paymentStatus === 'success' ? 'status-success' : paymentStatus === 'failed' ? 'status-failed' : 'status-pending'}>
                      {paymentStatus === 'success' ? 'SUCCESS' : paymentStatus === 'failed' ? 'FAILED' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="notice-box page-break-avoid">
            <strong>Declaration:</strong>
            <p>• I confirm that all information provided in this application is true and correct to the best of my knowledge.</p>
            <p>• Any false or misleading information may result in the rejection of my application or cancellation of admission.</p>
          </div>

          <div className="receipt-footer page-break-avoid">
            <p><strong>Thank you for choosing Periyar University!</strong></p>
            <p>For assistance, contact: +91-427-2345766 | cdoe@periyaruniversity.ac.in</p>
            <p>Website: www.periyaruniversity.ac.in</p>
          </div>

          <div className="print-timestamp">
            Printed on: {new Date().toLocaleString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p>Loading application data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(PaymentPage);