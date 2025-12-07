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
  const isSemesterPaid = paymentData?.payment?.semester_fee_paid === true || paymentData?.application?.semester_payment_status === 'P';
  
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
            <p className="text-gray-600">Track all your payments including application and semester fees</p>
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

      {/* Payment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Application Fee Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
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
                  <h2 className={`text-xl font-bold ${isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                    Application Fee
                  </h2>
                  <p className={`text-sm ${isPaid ? 'text-green-600' : 'text-orange-600'} mt-1`}>
                    {isPaid
                      ? 'Payment completed successfully'
                      : 'Complete your payment to proceed'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{applicationFee}</p>
                <p className="text-xs text-gray-500 mt-1">Including GST</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Semester Fee Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`p-6 rounded-xl border-2 ${isSemesterPaid ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${isSemesterPaid ? 'bg-green-500' : 'bg-blue-500'} flex items-center justify-center shadow-lg`}>
                  {isSemesterPaid ? (
                    <CheckCircleIcon className="h-10 w-10 text-white" />
                  ) : (
                    <BanknotesIcon className="h-10 w-10 text-white" />
                  )}
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isSemesterPaid ? 'text-green-700' : 'text-blue-700'}`}>
                    First Semester Fee
                  </h2>
                  <p className={`text-sm ${isSemesterPaid ? 'text-green-600' : 'text-blue-600'} mt-1`}>
                    {isSemesterPaid
                      ? 'Payment completed successfully'
                      : 'Semester tuition fee payment'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹20,000</p>
                <p className="text-xs text-gray-500 mt-1">Per Semester</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

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

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6"
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ReceiptPercentIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
              <p className="text-sm text-indigo-100">
                Your payment history and transaction details
              </p>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="divide-y divide-gray-200">
          {/* Application Fee Transaction */}
          {isPaid && (
            <div className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Application Fee</h4>
                    <p className="text-sm text-gray-600">One-time application processing fee</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Transaction ID: {transactionDetails?.transaction_id || 'N/A'} • 
                      {transactionDetails?.transaction_date 
                        ? new Date(transactionDetails.transaction_date).toLocaleDateString('en-IN')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">₹{applicationFee}</p>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    <CheckCircleIcon className="h-3 w-3" />
                    Paid
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Semester Fee Transaction */}
          <div className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isSemesterPaid ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {isSemesterPaid ? (
                    <CheckCircleIcon className={`h-6 w-6 ${isSemesterPaid ? 'text-green-600' : 'text-blue-600'}`} />
                  ) : (
                    <BanknotesIcon className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">First Semester Fee</h4>
                  <p className="text-sm text-gray-600">Semester 1 tuition fee (2025-26)</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isSemesterPaid ? (
                      <>Transaction ID: SEM2025-001 • December 7, 2025</>
                    ) : (
                      <>Due Date: December 20, 2025 • Status: Pending Payment</>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${isSemesterPaid ? 'text-green-600' : 'text-gray-900'}`}>₹20,000</p>
                {isSemesterPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    <CheckCircleIcon className="h-3 w-3" />
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    <ClockIcon className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Total Paid</p>
            <p className="text-2xl font-bold text-green-700">
              ₹{(isPaid ? parseFloat(applicationFee) : 0) + (isSemesterPaid ? 20000 : 0)}.00
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">Pending Payments</p>
            <p className="text-2xl font-bold text-orange-700">
              ₹{(!isPaid ? parseFloat(applicationFee) : 0) + (!isSemesterPaid ? 20000 : 0)}.00
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Due</p>
            <p className="text-2xl font-bold text-blue-700">
              ₹{(!isPaid ? parseFloat(applicationFee) : 0) + (!isSemesterPaid ? 20000 : 0)}.00
            </p>
          </div>
        </div>
      </motion.div>

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
