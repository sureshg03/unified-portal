import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import { generateReceiptPDF } from '../utils/pdfGenerator';

const PaymentHistory = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [applicationFee, setApplicationFee] = useState('236.00');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      console.log('📊 Fetching payment history from database...');
      const response = await axios.get(
        'http://localhost:8000/api/payment-history/',
        { headers: { Authorization: `Token ${token}` } }
      );

      console.log('📨 Payment history response:', response.data);

      if (response.data.status === 'success') {
        const data = response.data.data;
        setPaymentData(data);
        console.log('✅ Payment data set:', data);
        
        // Set dynamic application fee
        if (data.payment?.application_fee) {
          const fee = data.payment.application_fee.toFixed(2);
          setApplicationFee(fee);
          console.log('💰 Application fee set:', fee);
        }

        // Set transaction details directly from response
        if (data.transaction) {
          setTransactionDetails(data.transaction);
          console.log('✅ Transaction details loaded:', data.transaction);
        } else {
          console.log('ℹ️ No transaction details found in database');
        }
      } else {
        console.warn('⚠️ Unexpected response status:', response.data);
        toast.error(response.data.message || 'Failed to load payment history');
      }
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      toast.error(error.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      const loadingToast = toast.loading('Generating payment receipt...');

      const response = await axios.get(
        'http://localhost:8000/api/download-receipt/',
        {
          headers: { Authorization: `Token ${token}` },
          responseType: 'json',
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success('Receipt generated successfully!');
        generateReceiptPDF(response.data.data);
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading receipt:', error);
      toast.error(error.response?.data?.message || 'Failed to download receipt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  const isPaid = paymentData?.application?.payment_status === 'P';
  
  console.log('🎨 Rendering PaymentHistory:', {
    paymentData,
    isPaid,
    transactionDetails,
    applicationFee,
    loading
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
            <p className="text-gray-600">View your application fee payment details</p>
          </div>
          {isPaid && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadReceipt}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Download Receipt</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Payment Status Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6"
      >
        <div className={`p-6 rounded-xl border-2 ${isPaid ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500' : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-500'} shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full ${isPaid ? 'bg-green-500' : 'bg-orange-500'} flex items-center justify-center shadow-lg`}>
                {isPaid ? (
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                ) : (
                  <ClockIcon className="h-10 w-10 text-white" />
                )}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                  {isPaid ? 'Payment Completed' : 'Payment Pending'}
                </h2>
                <p className={`text-sm ${isPaid ? 'text-green-600' : 'text-orange-600'} mt-1`}>
                  {isPaid
                    ? 'Your application fee has been successfully paid'
                    : 'Complete your payment to proceed with the application'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Amount</p>
              <p className="text-3xl font-bold text-gray-900">₹{applicationFee}</p>
              <p className="text-xs text-gray-500 mt-1">Including GST</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Debug Info - Remove after testing */}
      {isPaid && !transactionDetails && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Debug: Payment is marked as completed but transaction details not loaded.
            <br />
            Payment Status: {paymentData?.application?.payment_status}
            <br />
            Application ID: {paymentData?.application?.application_id || 'Not set'}
          </p>
        </div>
      )}

      {/* Payment Details */}
      {isPaid && paymentData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <ReceiptPercentIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Transaction Details</h3>
                <p className="text-sm text-indigo-100">
                  {transactionDetails ? 'Application Fee Payment' : 'Loading transaction details...'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Application Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                  Application Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Application ID</p>
                    <p className="font-mono text-sm font-semibold text-indigo-600">
                      {paymentData.application.application_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Student Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {paymentData.student.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {paymentData.student.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Course</p>
                    <p className="text-sm font-medium text-gray-900">
                      {paymentData.application.degree || paymentData.application.course || paymentData.application.mode_of_study}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mode of Study</p>
                    <p className="text-sm font-medium text-gray-900">
                      {paymentData.application.mode_of_study}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                  Payment Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      {transactionDetails?.transaction_id || 'N/A'}
                    </p>
                  </div>
                  {transactionDetails?.bank_transaction_id && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bank Transaction ID</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {transactionDetails.bank_transaction_id}
                      </p>
                    </div>
                  )}
                  {transactionDetails?.order_id && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {transactionDetails.order_id}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="h-4 w-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">
                        {transactionDetails?.gateway_name || 'Online Payment'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">
                        {transactionDetails?.transaction_date 
                          ? new Date(transactionDetails.transaction_date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                      <CheckCircleIcon className="h-4 w-4" />
                      {transactionDetails?.payment_status || 'SUCCESS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Amount Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Application Fee (Including GST)</span>
                  <span className="text-sm font-medium text-gray-900">₹{applicationFee}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-900">Total Amount Paid</span>
                  <span className="text-xl font-bold text-green-600">₹{transactionDetails?.amount || applicationFee}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State for No Payment */}
      {!isPaid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BanknotesIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Payment History</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't made any payments yet. Complete your application payment to view transaction details here.
          </p>
          <button
            onClick={() => window.location.href = '/application/payment'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            <BanknotesIcon className="h-5 w-5" />
            <span>Make Payment</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentHistory;
