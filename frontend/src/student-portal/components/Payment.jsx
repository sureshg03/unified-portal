import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { ArrowLeftIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Payment = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

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
        toast.success(`Application ID: ${response.data.application_id}`, { duration: 6000 });

        setTimeout(() => {
          navigate(`/application-download/${response.data.application_id}`);
        }, 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 transition-colors">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Payment & Application ID</h1>
          <p className="text-gray-600">Complete your payment to generate your unique Application ID</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <XCircleIcon className="h-16 w-16" />
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">Payment Not Available</h2>
            <p className="text-center text-indigo-100 text-lg">Student profile not found</p>
          </div>

          <div className="p-8">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Application ID Format</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p className="font-mono bg-white px-3 py-2 rounded border border-blue-200">
                  <strong>Format:</strong> PU/ODL/LC2101/A24/0002
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  <div className="bg-white px-3 py-2 rounded border border-blue-200"><strong>PU</strong> - Periyar University (Common)</div>
                  <div className="bg-white px-3 py-2 rounded border border-blue-200"><strong>ODL</strong> - Mode of Study (from Page 1)</div>
                  <div className="bg-white px-3 py-2 rounded border border-blue-200"><strong>LC2101</strong> - Current LSC Code</div>
                  <div className="bg-white px-3 py-2 rounded border border-blue-200"><strong>A24</strong> - Academic Year</div>
                  <div className="bg-white px-3 py-2 rounded border border-blue-200 md:col-span-2"><strong>0002</strong> - Serial Number (Auto-incremented)</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-6 rounded-r-lg">
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Complete Dummy Payment</h3>
                  <p className="text-green-800 mb-4">Click the button below to simulate payment and generate your Application ID</p>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDummyPayment}
                    disabled={processing}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      '✓ Complete Payment & Generate Application ID'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📌 What happens next?</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5 flex-shrink-0">1</span>
                  <span>Payment will be processed instantly (dummy/test mode)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5 flex-shrink-0">2</span>
                  <span>Your unique Application ID will be generated automatically</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5 flex-shrink-0">3</span>
                  <span>You'll be redirected to the Application Download page</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5 flex-shrink-0">4</span>
                  <span>Download your receipt with the Application ID</span>
                </li>
              </ol>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/dashboard')} className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors">
                Back to Dashboard
              </motion.button>
              
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/application/page1')} className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Edit Application
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 text-center text-sm text-gray-600">
          <p>Having issues? Contact support or return to your dashboard.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Payment;
