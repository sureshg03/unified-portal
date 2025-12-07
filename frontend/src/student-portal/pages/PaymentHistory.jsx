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
import { generateReceiptPDF, generateIndividualReceiptPDF, generateOverallPaymentReceiptPDF } from '../utils/pdfGenerator';

const PaymentHistory = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [applicationFee, setApplicationFee] = useState('236.00');
  const [semesterPayments, setSemesterPayments] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [semesterStudentData, setSemesterStudentData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Utility function to fetch LSC data directly from API
  const fetchLSCData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      console.log('🔄 Fetching LSC data directly from API...');
      const response = await axios.get(
        'http://localhost:8000/api/semester-payments/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success' && response.data.student) {
        const studentData = response.data.student;
        console.log('✅ LSC data fetched:', { lsc_code: studentData.lsc_code, lsc_name: studentData.lsc_name });
        return {
          lsc_code: studentData.lsc_code,
          lsc_name: studentData.lsc_name
        };
      }
    } catch (error) {
      console.warn('❌ Failed to fetch LSC data:', error);
    }
    return null;
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        'http://localhost:8000/api/user-profile/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        // Store user profile data in localStorage for LSC information
        localStorage.setItem('userProfile', JSON.stringify(response.data.data));
        console.log('✅ User profile stored for LSC data:', response.data.data);
      }
    } catch (error) {
      console.warn('Could not fetch user profile for LSC data:', error);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
    fetchUserProfile();
  }, []);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch application payment history
      const appResponse = await axios.get(
        'http://localhost:8000/api/payment-history/',
        { headers: { Authorization: `Token ${token}` } }
      );

      // Fetch all semester payments
      const semesterResponse = await axios.get(
        'http://localhost:8000/api/semester-payments/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (appResponse.data.status === 'success') {
        const data = appResponse.data.data;
        setPaymentData(data);
        
        if (data.payment?.application_fee) {
          setApplicationFee(data.payment.application_fee.toFixed(2));
        }

        if (data.transaction) {
          setTransactionDetails(data.transaction);
        }

        // Log student data from payment history API
        if (data.student) {
          console.log('✅ Payment history student data:', data.student);
        }
      }

      // Process semester payments
      if (semesterResponse.data.status === 'success') {
        const semesterData = semesterResponse.data.payments || [];
        setSemesterPayments(semesterData);
        
        // Store student data from semester payments API
        if (semesterResponse.data.student) {
          setSemesterStudentData(semesterResponse.data.student);
          console.log('✅ Semester student data stored:', semesterResponse.data.student);
        }
      }

      // Combine all transactions
      const allTxns = [];

      // Add application payment if exists
      if (appResponse.data.status === 'success' && appResponse.data.data?.transaction) {
        allTxns.push({
          id: appResponse.data.data.transaction.transaction_id,
          type: 'application',
          title: 'Application Fee',
          description: 'One-time application processing fee',
          amount: parseFloat(appResponse.data.data.transaction.amount),
          status: 'paid',
          transactionId: appResponse.data.data.transaction.transaction_id,
          date: appResponse.data.data.transaction.transaction_date,
          paymentMethod: appResponse.data.data.transaction.payment_mode || 'Online',
          semester: null
        });
      }

      // Add semester payments
      if (semesterResponse.data.status === 'success') {
        const semesterTxns = (semesterResponse.data.payments || []).map(payment => ({
          id: payment.transaction_id || `SEM-${payment.semester_number}-${Date.now()}`,
          type: 'semester',
          title: `${payment.semester} Fee`,
          description: `Semester ${payment.semester_number} tuition fee`,
          amount: parseFloat(payment.amount),
          status: payment.payment_status === 'SUCCESS' ? 'paid' : 'pending',
          transactionId: payment.transaction_id,
          date: payment.payment_date,
          paymentMethod: payment.payment_method || 'Online',
          semester: payment.semester_number
        }));
        allTxns.push(...semesterTxns);
      }

      // Sort transactions by date (newest first)
      allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllTransactions(allTxns);

      setDataLoaded(true);
      console.log('✅ Data loading completed. dataLoaded = true');

    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history.');
      setDataLoaded(false);
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

  const handleDownloadIndividualReceipt = async (transaction) => {
    if (loading || !dataLoaded) {
      toast.error('Please wait for data to load before generating receipts.');
      return;
    }
    
    try {
      console.log('🧾 Starting individual receipt generation...');
      console.log('Current loading state:', loading);
      console.log('Current dataLoaded state:', dataLoaded);
      console.log('Current semesterStudentData:', semesterStudentData);
      console.log('Current paymentData:', paymentData);
      console.log('Current paymentData.student:', paymentData?.student);
      
      // Get LSC information - try direct API fetch first
      console.log('🔍 Getting LSC data for receipt...');
      let lscData = await fetchLSCData();
      
      let lscCode = lscData?.lsc_code || semesterStudentData?.lsc_code || paymentData?.student?.lsc_code || '';
      let lscName = lscData?.lsc_name || semesterStudentData?.lsc_name || paymentData?.student?.lsc_name || '';

      // Fallback to localStorage if still no data
      if (!lscCode || !lscName) {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        lscCode = userProfile.lsc_code || lscCode;
        lscName = userProfile.lsc_name || lscName;
      }

      console.log('Selected LSC Code:', lscCode);
      console.log('Selected LSC Name:', lscName);

      // If we still don't have LSC data, show an error
      if (!lscCode || !lscName) {
        console.error('❌ No LSC data available for receipt generation');
        toast.error('LSC information not available. Please refresh the page and try again.');
        return;
      }

      // If not available from API data, try to get from localStorage user profile
      if (!lscCode || !lscName) {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        lscCode = userProfile.lsc_code || lscCode;
        lscName = userProfile.lsc_name || lscName;
      }

      // Prepare receipt data for individual transaction
      const receiptData = {
        ...transaction,
        application_id: paymentData?.application?.application_id || '',
        student_name: semesterStudentData?.name || paymentData?.student?.name || '',
        email: semesterStudentData?.email || paymentData?.student?.email || '',
        phone: semesterStudentData?.phone || paymentData?.student?.phone || '',
        course: paymentData?.application?.course || '',
        mode_of_study: paymentData?.application?.mode_of_study || '',
        lsc_code: lscCode,
        lsc_name: lscName,
        receipt_number: transaction.receipt_number || transaction.transactionId,
      };

      // Debug logging
      console.log('Generating individual receipt with data:', {
        transaction,
        semesterStudentData,
        paymentStudentData: paymentData?.student,
        application: paymentData?.application,
        lsc_code: receiptData.lsc_code,
        lsc_name: receiptData.lsc_name,
        userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}')
      });

      toast.success(`Generating ${transaction.title} receipt...`);
      generateIndividualReceiptPDF(receiptData);
    } catch (error) {
      console.error('Error generating individual receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  const handleDownloadOverallReceipt = async () => {
    if (loading || !dataLoaded) {
      toast.error('Please wait for data to load before generating receipts.');
      return;
    }
    
    try {
      console.log('🧾 Starting overall receipt generation...');
      console.log('Current semesterStudentData:', semesterStudentData);
      console.log('Current paymentData.student:', paymentData?.student);
      
      // Get LSC information - try direct API fetch first
      console.log('🔍 Getting LSC data for overall receipt...');
      let lscData = await fetchLSCData();
      
      let studentData = { 
        ...(semesterStudentData || paymentData?.student),
        lsc_code: lscData?.lsc_code || semesterStudentData?.lsc_code || paymentData?.student?.lsc_code || '',
        lsc_name: lscData?.lsc_name || semesterStudentData?.lsc_name || paymentData?.student?.lsc_name || ''
      };

      // Fallback to localStorage if still no data
      if (!studentData.lsc_code || !studentData.lsc_name) {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        studentData.lsc_code = userProfile.lsc_code || studentData.lsc_code || '';
        studentData.lsc_name = userProfile.lsc_name || studentData.lsc_name || '';
      }

      console.log('Final student data for receipt:', studentData);
      console.log('Final LSC Code:', studentData.lsc_code);
      console.log('Final LSC Name:', studentData.lsc_name);

      // If we still don't have LSC data, show an error
      if (!studentData.lsc_code || !studentData.lsc_name) {
        console.error('❌ No LSC data available for receipt generation');
        toast.error('LSC information not available. Please refresh the page and try again.');
        return;
      }

      // Prepare overall receipt data
      const receiptData = {
        student: studentData,
        application: paymentData?.application || {},
        transactions: allTransactions,
        summary: {
          totalPaid,
          totalPending,
          totalTransactions: allTransactions.length
        }
      };

      // Debug logging
      console.log('Generating overall receipt with data:', {
        student: receiptData.student,
        application: receiptData.application,
        transactions: receiptData.transactions,
        summary: receiptData.summary,
        lsc_code: receiptData.student?.lsc_code,
        lsc_name: receiptData.student?.lsc_name,
        userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}')
      });

      toast.success('Generating complete payment history receipt...');
      generateOverallPaymentReceiptPDF(receiptData);
    } catch (error) {
      console.error('Error generating overall receipt:', error);
      toast.error('Failed to generate payment history receipt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }
  if (!loading && (!paymentData || allTransactions.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        No payment history found. Please check your connection or try again later.
      </div>
    );
  }

  const isPaid = paymentData?.application?.payment_status === 'P';
  const isSemesterPaid = paymentData?.payment?.semester_fee_paid === true || paymentData?.application?.semester_payment_status === 'P';
  
  // Calculate totals from actual transaction data
  const totalPaid = allTransactions
    .filter(txn => txn.status === 'paid')
    .reduce((sum, txn) => sum + txn.amount, 0);
  
  const totalPending = allTransactions
    .filter(txn => txn.status === 'pending')
    .reduce((sum, txn) => sum + txn.amount, 0);
  
  console.log('🎨 Rendering PaymentHistory:', {
    paymentData,
    isPaid,
    transactionDetails,
    applicationFee,
    loading,
    semesterPayments,
    allTransactions,
    totalPaid,
    totalPending
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
          <div className="flex gap-3">
            {isPaid && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadReceipt}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Application Receipt</span>
              </motion.button>
            )}
            {allTransactions.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadOverallReceipt}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
              >
                <ReceiptPercentIcon className="h-5 w-5" />
                <span>Complete History</span>
              </motion.button>
            )}
          </div>
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
                    Semester Fees
                  </h2>
                  <p className={`text-sm ${isSemesterPaid ? 'text-green-600' : 'text-blue-600'} mt-1`}>
                    {isSemesterPaid
                      ? `${semesterPayments.filter(p => p.payment_status === 'SUCCESS').length} semester(s) paid`
                      : 'Semester tuition fee payments'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{semesterPayments
                    .filter(p => p.payment_status === 'SUCCESS')
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all semesters</p>
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-6">
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
          {allTransactions.length > 0 ? (
            allTransactions.map((transaction, index) => (
              <div key={transaction.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      transaction.status === 'paid' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {transaction.status === 'paid' ? (
                        <CheckCircleIcon className={`h-6 w-6 ${
                          transaction.status === 'paid' ? 'text-green-600' : 'text-orange-600'
                        }`} />
                      ) : (
                        <ClockIcon className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{transaction.title}</h4>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.transactionId ? (
                          <>Transaction ID: {transaction.transactionId} • </>
                        ) : (
                          <>Reference ID: {transaction.id} • </>
                        )}
                        {transaction.date 
                          ? new Date(transaction.date).toLocaleDateString('en-IN')
                          : 'Date not available'
                        }
                        {transaction.paymentMethod && (
                          <> • {transaction.paymentMethod}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.status === 'paid' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      ₹{transaction.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {transaction.status === 'paid' ? (
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
                      {transaction.status === 'paid' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownloadIndividualReceipt(transaction)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded text-xs"
                          title={`Download ${transaction.title} receipt`}
                        >
                          <DocumentArrowDownIcon className="h-3 w-3" />
                          <span>Receipt</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <BanknotesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions found</p>
            </div>
          )}
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
              ₹{totalPaid.toLocaleString()}.00
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">Pending Payments</p>
            <p className="text-2xl font-bold text-orange-700">
              ₹{totalPending.toLocaleString()}.00
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-700">
              {allTransactions.length}
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
