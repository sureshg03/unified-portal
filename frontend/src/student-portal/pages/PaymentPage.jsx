import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
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
import { generateProfessionalApplicationPDF } from '../utils/professionalApplicationPDF';
import { generateApplicationFormPDF } from '../utils/applicationFormPDF';

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
        'http://localhost:8000/api/application-payment-data/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        setApplicationData(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load application data');
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load application data. Please complete your profile and application first.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDummyPayment = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please log in again.');
        navigate('/login');
        return;
      }

      const response = await axios.post(
        'http://localhost:8000/api/verify-dummy-payment/',
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        toast.success('Payment completed successfully!');
        
        // Store payment details for display
        setPaymentDetails({
          application_id: response.data.application_id,
          transaction_id: response.data.data?.transaction_id || `TXN${Date.now()}`,
          bank_transaction_id: response.data.data?.bank_transaction_id || `BANK${Date.now()}`,
          order_id: response.data.data?.order_id || `ORD${Date.now()}`,
          amount: response.data.data?.amount || '236.00',
          payment_mode: 'DUMMY_GATEWAY',
          transaction_date: new Date().toLocaleString(),
          status: 'SUCCESS'
        });

        // Refresh application data to show updated Application ID
        await fetchApplicationData();
      } else {
        toast.error(response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'An error occurred during payment';
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        navigate('/login');
        return;
      }

      const loadingToast = toast.loading('Generating payment receipt...');
      
      const response = await axios.get(
        'http://localhost:8000/api/download-receipt/',
        { 
          headers: { Authorization: `Token ${token}` },
          responseType: 'json'
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success('Receipt generated successfully!');
        
        // Log the receipt data for debugging
        console.log('Receipt Data:', response.data.data);
        console.log('Transaction ID:', response.data.data.transaction_id);
        console.log('Bank Transaction ID:', response.data.data.bank_transaction_id);
        console.log('Order ID:', response.data.data.order_id);
        
        // Generate PDF with the receipt data
        generateReceiptPDF(response.data.data);
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading receipt:', error);
      toast.error(error.response?.data?.message || 'Failed to download receipt');
    }
  };

  const handleDownloadApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        navigate('/login');
        return;
      }

      const loadingToast = toast.loading('Generating application form...');
      
      const response = await axios.get(
        'http://localhost:8000/api/download-application/',
        { 
          headers: { Authorization: `Token ${token}` },
          responseType: 'json'
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success('Application form generated successfully!');
        
        // Log the data for debugging
        console.log('Application Data:', response.data.data);
        
        // Generate PDF matching PUCDOE.pdf reference format exactly
        generateApplicationFormPDF(response.data.data);
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading application:', error);
      toast.error(error.response?.data?.message || 'Failed to download application');
    }
  };

  const handleClearPayment = async () => {
    if (!window.confirm('Are you sure you want to clear your payment and start a new application? This will reset your current application.')) {
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please log in again.');
        navigate('/login');
        return;
      }

      const response = await axios.post(
        'http://localhost:8000/api/clear-payment/',
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        toast.success('✅ Payment cleared successfully! You can now start a new application.');
        
        setTimeout(() => {
          navigate('/application/page1');
        }, 2000);
      } else {
        toast.error(response.data.message || 'Failed to clear payment');
      }
    } catch (error) {
      console.error('Error clearing payment:', error);
      toast.error(error.response?.data?.message || 'An error occurred while clearing payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading application data...</p>
        </div>
      </div>
    );
  }

  if (error || !applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <Toaster position="top-right" />
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button onClick={() => navigate('/dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white">
              <div className="flex items-center justify-center mb-4">
                <XCircleIcon className="h-16 w-16" />
              </div>
              <h2 className="text-3xl font-bold text-center mb-2">Payment Not Available</h2>
              <p className="text-center text-red-100 text-lg">{error || 'Student profile not found'}</p>
            </div>
            
            <div className="p-8">
              <div className="text-center space-y-4">
                <p className="text-gray-600">Please complete your student profile and application before proceeding to payment.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => navigate('/dashboard')} 
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back to Dashboard
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => navigate('/application/page1')} 
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Start Application
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const { student, application, admission, application_id_format } = applicationData;
  const isPaid = application.payment_status === 'P';

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Payment & Application Portal
              </h1>
              <p className="text-sm text-gray-600">
                Complete your payment to generate Application ID and download receipt
              </p>
            </div>
            
            {isPaid && (
              <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Payment Completed</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Student & Application Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Student Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <p className="text-sm text-indigo-100">{student.email}</p>
                  </div>
                </div>
                
                {application.application_id && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs text-indigo-200 mb-1">Application ID</p>
                    <p className="font-mono text-sm font-semibold">{application.application_id}</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">LSC Center</span>
                  <span className="text-sm font-semibold text-gray-900">{student.lsc_code}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">LSC Name</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{student.lsc_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Mode of Study</span>
                  <span className="text-sm font-semibold text-gray-900">{application.mode_of_study}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Academic Year</span>
                  <span className="text-sm font-semibold text-gray-900">{application.academic_year}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <span className={`text-sm font-semibold flex items-center space-x-1 ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                    {isPaid ? <CheckCircleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
                    <span>{isPaid ? 'Paid' : 'Pending'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Gateway Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCardIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Payment Gateway</h2>
                    <p className="text-sm text-gray-600">Complete your application fee payment</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {!isPaid ? (
                    <div className="space-y-6">
                      {/* Payment Amount Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                              <BanknotesIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Application Fee</p>
                              <p className="text-3xl font-bold text-gray-900">₹236.00</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                              One-time
                            </span>
                            <p className="text-xs text-gray-500 mt-1">Including GST</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                          <span className="text-sm text-gray-600">Gateway Charges</span>
                          <span className="text-sm font-semibold text-gray-900">₹0.00</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-bold text-gray-900">Total Amount</span>
                          <span className="text-lg font-bold text-blue-600">₹236.00</span>
                        </div>
                      </div>

                      {/* Payment Gateway Button */}
                      {processing ? (
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-white shadow-lg">
                          <div className="text-center space-y-4">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto"
                            />
                            <div>
                              <p className="text-lg font-semibold">Processing Payment...</p>
                              <p className="text-sm text-green-100 mt-1">Please wait, do not refresh this page</p>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3">
                              <div className="flex items-center justify-center space-x-2 text-sm">
                                <ShieldCheckIcon className="h-5 w-5" />
                                <span>Secure Transaction in Progress</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleDummyPayment}
                          className="group relative w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <ShieldCheckIcon className="h-6 w-6" />
                            <span className="text-lg">Proceed to Secure Payment</span>
                            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                        </button>
                      )}

                      {/* Security Badges */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-xs font-semibold text-gray-700">SSL Secured</p>
                            <p className="text-xs text-gray-500">256-bit Encryption</p>
                          </div>
                          <div className="text-center border-l border-r border-gray-300">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-xs font-semibold text-gray-700">Bank Grade</p>
                            <p className="text-xs text-gray-500">PCI DSS Certified</p>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <p className="text-xs font-semibold text-gray-700">Instant</p>
                            <p className="text-xs text-gray-500">Real-time Processing</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">Accepted Payment Methods</p>
                        <div className="flex items-center justify-center space-x-3">
                          <span className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">Cards</span>
                          <span className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">UPI</span>
                          <span className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">Net Banking</span>
                          <span className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">Wallets</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-5 py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
                      >
                        <CheckCircleIcon className="h-12 w-12 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                        <p className="text-sm text-gray-600">Your transaction has been completed successfully</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-medium">Application ID Generated</p>
                        <p className="font-mono text-xl font-bold text-gray-900 mb-3">{application.application_id}</p>
                        <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-xs font-semibold">Verified & Active</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Transaction Details Table */}
            {(isPaid || paymentDetails) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ReceiptPercentIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Transaction Details</h2>
                      <p className="text-sm text-gray-600">Complete payment information</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Application ID</td>
                          <td className="py-3 font-mono text-gray-900">{application.application_id}</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Transaction ID</td>
                          <td className="py-3 font-mono text-gray-900">{paymentDetails?.transaction_id || `TXN${Date.now()}`}</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Bank Transaction ID</td>
                          <td className="py-3 font-mono text-gray-900">{paymentDetails?.bank_transaction_id || `BANK${Date.now()}`}</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Order ID</td>
                          <td className="py-3 font-mono text-gray-900">{paymentDetails?.order_id || `ORD${Date.now()}`}</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Transaction Amount</td>
                          <td className="py-3 font-semibold text-gray-900">₹{paymentDetails?.amount || '236.00'}</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Payment Mode</td>
                          <td className="py-3 text-gray-900">{paymentDetails?.payment_mode || 'DUMMY_GATEWAY'}</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Gateway Name</td>
                          <td className="py-3 text-gray-900">TEST_BANK</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Transaction Date</td>
                          <td className="py-3 text-gray-900 flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <span>{paymentDetails?.transaction_date || new Date().toLocaleString()}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Payment Status</td>
                          <td className="py-3">
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>SUCCESS</span>
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Response Code</td>
                          <td className="py-3 text-gray-900">01</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-gray-700">Response Message</td>
                          <td className="py-3 text-gray-900">Txn Success</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-3">
                {isPaid && (
                  <>
                    <button
                      onClick={handleDownloadReceipt}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      <span>Download Payment Receipt</span>
                    </button>
                    
                    <button
                      onClick={handleDownloadApplication}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      <span>Download Application Form</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleClearPayment}
                  disabled={processing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Clear Payment & Start New Application</span>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/application/page1')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                  >
                    Edit Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
            <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Secure Payment Gateway • Instant Processing • 24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;