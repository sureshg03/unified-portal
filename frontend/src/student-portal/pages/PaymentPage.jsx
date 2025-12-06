import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  UserCircleIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  CalendarIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { generateComprehensiveApplicationPDF } from '../utils/comprehensiveApplicationPDF';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState(null);
  const [error, setError] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    fetchApplicationData();
  }, []);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please log in again.');
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/application-payment-data/`,
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        setApplicationData(response.data.data);
        setPaymentDetails(response.data.payment_details);
      } else {
        setError('Failed to load application data');
        toast.error('Failed to load application data');
      }
    } catch (err) {
      console.error('Error fetching application data:', err);
      setError('Failed to load application data');
      toast.error('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!applicationData || !paymentDetails) {
      toast.error('Application data not loaded');
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const paymentData = {
        application_id: applicationData.id,
        amount: paymentDetails.total_amount,
        payment_method: 'razorpay',
        payment_type: 'application_fee'
      };

      // Initialize Razorpay payment
      const options = {
        key: 'rzp_test_your_key_here', // Replace with your Razorpay key
        amount: paymentDetails.total_amount * 100, // Amount in paisa
        currency: 'INR',
        name: 'Periyar University - CDOE',
        description: 'Application Fee Payment',
        image: '/Logo.png',
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await axios.post(
              'http://localhost:8000/api/verify-payment/',
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                application_id: applicationData.id
              },
              { headers: { Authorization: `Token ${token}` } }
            );

            if (verifyResponse.data.status === 'success') {
              toast.success('Payment successful!');

              // Generate receipt
              await generateReceiptPDF({
                applicationData,
                paymentDetails: {
                  ...paymentDetails,
                  transaction_id: response.razorpay_payment_id,
                  payment_date: new Date().toISOString()
                }
              });

              // Navigate to success page
              setTimeout(() => {
                navigate('/student/submitted');
              }, 2000);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: applicationData.student?.name || '',
          email: applicationData.student?.email || '',
          contact: applicationData.student?.phone || ''
        },
        notes: {
          address: 'Periyar University - Salem'
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment');
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!applicationData || !paymentDetails) {
      toast.error('Application data not available');
      return;
    }

    try {
      await generateReceiptPDF({
        applicationData,
        paymentDetails
      });
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error('Failed to generate receipt');
    }
  };

  const handleDownloadApplication = async () => {
    if (!applicationData) {
      toast.error('Application data not available');
      return;
    }

    try {
      await generateComprehensiveApplicationPDF(applicationData);
      toast.success('Application downloaded successfully');
    } catch (error) {
      console.error('Application generation error:', error);
      toast.error('Failed to generate application PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md"
        >
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Payment Portal</h1>
              <p className="text-gray-600">Complete your application payment</p>
            </div>
            <div className="w-20"></div> {/* Spacer */}
          </div>
        </motion.div>

        {/* Application Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <UserCircleIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Application Summary</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Application ID:</span>
                <p className="text-gray-900">{applicationData?.id || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Student Name:</span>
                <p className="text-gray-900">{applicationData?.student?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{applicationData?.student?.email || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Course:</span>
                <p className="text-gray-900">{applicationData?.course || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Academic Year:</span>
                <p className="text-gray-900">{applicationData?.academic_year || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Application Date:</span>
                <p className="text-gray-900">
                  {applicationData?.created_at ? new Date(applicationData.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <BanknotesIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-700">Application Fee</span>
              <span className="text-2xl font-bold text-gray-900">₹{paymentDetails?.application_fee || 0}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-700">Processing Fee</span>
              <span className="text-lg text-gray-600">₹{paymentDetails?.processing_fee || 0}</span>
            </div>
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-bold text-green-600">₹{paymentDetails?.total_amount || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-blue-500" />
              <span>Instant Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <ReceiptPercentIcon className="h-4 w-4 text-purple-500" />
              <span>Receipt Generated</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <CreditCardIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
          </div>

          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BuildingLibraryIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Razorpay</h3>
                  <p className="text-sm text-gray-600">Secure online payment gateway</p>
                </div>
              </div>
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>• All major credit/debit cards accepted</p>
            <p>• Net Banking and UPI payments supported</p>
            <p>• EMI options available for amounts above ₹5,000</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 bg-green-600 text-white py-4 px-8 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3 text-lg font-semibold"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-6 w-6" />
                  <span>Pay ₹{paymentDetails?.total_amount || 0}</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">
              By proceeding with payment, you agree to our terms and conditions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownloadApplication}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Download Application</span>
              </button>
              {paymentDetails?.payment_status === 'completed' && (
                <button
                  onClick={handleDownloadReceipt}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Download Receipt</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8"
        >
          <div className="flex items-start space-x-3">
            <CalendarIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Payment is non-refundable once the application is processed</li>
                <li>• Keep the payment receipt for future reference</li>
                <li>• For payment related queries, contact the admission office</li>
                <li>• Processing time: 2-3 business days after successful payment</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default PaymentPage;