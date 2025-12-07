import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BanknotesIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, DocumentArrowDownIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import PaymentGateway from '../components/PaymentGateway';
import ReceiptDownload from '../components/ReceiptDownload';

const SemesterPayments = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paymentReceipts, setPaymentReceipts] = useState({});

  // Semester fee structure with dynamic status and colors
  const [semesterFees, setSemesterFees] = useState([
    { semester: 'SEM - 1', semester_number: 1, amount: 20000, status: 'pending', mandatory: true, color: 'red', locked: false },
    { semester: 'SEM - 2', semester_number: 2, amount: 16750, status: 'locked', mandatory: false, color: 'yellow', locked: true },
    { semester: 'SEM - 3', semester_number: 3, amount: 18375, status: 'locked', mandatory: false, color: 'yellow', locked: true },
    { semester: 'SEM - 4', semester_number: 4, amount: 18375, status: 'locked', mandatory: false, color: 'yellow', locked: true },
    { semester: 'SEM - 5', semester_number: 5, amount: 0, status: 'not-applicable', mandatory: false, color: 'gray', locked: true },
    { semester: 'SEM - 6', semester_number: 6, amount: 0, status: 'not-applicable', mandatory: false, color: 'gray', locked: true },
  ]);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch semester payments from backend
      const paymentsResponse = await axios.get(
        'http://localhost:8000/api/semester-payments/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (paymentsResponse.data.status === 'success') {
        const payments = paymentsResponse.data.payments;
        const paidSemesterNumbers = paymentsResponse.data.paid_semesters;

        // Update semester fees status based on backend data with progressive unlock
        setSemesterFees(prevFees =>
          prevFees.map((fee, index) => {
            const isPaid = paidSemesterNumbers.includes(fee.semester_number);
            const previousSemesterPaid = index === 0 || paidSemesterNumbers.includes(fee.semester_number - 1);
            
            let status = fee.status;
            let locked = fee.locked;
            
            if (isPaid) {
              status = 'paid';
              locked = false;
            } else if (previousSemesterPaid && fee.amount > 0) {
              status = 'pending';
              locked = false;
            } else if (!previousSemesterPaid && fee.amount > 0) {
              status = 'locked';
              locked = true;
            }
            
            return { ...fee, status, locked };
          })
        );

        // Build receipts object from payment records
        const receiptsData = {};
        payments.forEach(payment => {
          receiptsData[payment.semester] = {
            receiptNumber: payment.receipt_number,
            date: new Date(payment.payment_date).toLocaleString(),
            transactionId: payment.transaction_id,
            paymentMethod: payment.payment_method,
            studentName: payment.student_name,
            applicationId: payment.application_id,
            email: payment.student_email,
            semester: payment.semester,
            description: `${payment.semester} Fee Payment`,
            amount: parseFloat(payment.amount),
            paymentDate: new Date(payment.payment_date).toLocaleDateString(),
          };
        });
        setPaymentReceipts(receiptsData);
      }

      // Fetch application data for reference
      const appResponse = await axios.get(
        'http://localhost:8000/api/application-payment-data/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (appResponse.data.status === 'success') {
        setPaymentData(appResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };  const handlePayment = (semester, amount) => {
    setCurrentPayment({ semester, amount });
    setPaymentGatewayOpen(true);
  };

  const handlePaymentSuccess = async (cardNumber, cardHolderName) => {
    const { semester, amount } = currentPayment;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      // Extract semester number from semester string (e.g., "SEM - 1" -> 1)
      const semesterNumber = parseInt(semester.split('-')[1].trim());

      // Send payment data to backend
      const response = await axios.post(
        'http://localhost:8000/api/semester-payments/process/',
        {
          semester: semester,
          semester_number: semesterNumber,
          amount: amount,
          card_number: cardNumber,
          card_holder_name: cardHolderName,
          expiry_month: '12',
          expiry_year: '25',
          cvv: '123'
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        const paymentRecord = response.data.payment;

        // Update local state to reflect payment and unlock next semester
        setSemesterFees(prevFees =>
          prevFees.map((fee, index) => {
            if (fee.semester === semester) {
              return { ...fee, status: 'paid', locked: false };
            }
            // Unlock next semester if current is paid
            if (index > 0 && prevFees[index - 1].semester === semester && fee.amount > 0) {
              return { ...fee, status: 'pending', locked: false };
            }
            return fee;
          })
        );

        // Store receipt data in state for immediate display
        const receiptData = {
          receiptNumber: paymentRecord.receipt_number,
          date: new Date(paymentRecord.payment_date).toLocaleString(),
          transactionId: paymentRecord.transaction_id,
          paymentMethod: paymentRecord.payment_method,
          studentName: paymentRecord.student_name,
          applicationId: paymentRecord.application_id,
          email: paymentRecord.student_email,
          semester: paymentRecord.semester,
          description: `${paymentRecord.semester} Fee Payment`,
          amount: parseFloat(paymentRecord.amount),
          paymentDate: new Date(paymentRecord.payment_date).toLocaleDateString(),
        };

        setPaymentReceipts(prev => ({
          ...prev,
          [semester]: receiptData
        }));

        toast.success(`Payment successful! ${semester} fee of ₹${amount.toLocaleString()} has been paid.`, {
          duration: 5000
        });

        // If first semester payment, show portal access message
        if (response.data.first_semester_paid) {
          setTimeout(() => {
            toast.success('🎓 First semester payment completed! You now have full access to the student portal.', {
              duration: 6000
            });
            // Trigger page refresh to update sidebar menu
            setTimeout(() => window.location.reload(), 2000);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <BanknotesIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Semester Payments</h1>
            <p className="text-purple-100">Manage your semester fee payments</p>
          </div>
        </div>
      </motion.div>

      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {semesterFees.map((fee, index) => {
            const getColorClasses = () => {
              if (fee.status === 'paid') return 'bg-green-50 border-green-300';
              if (fee.status === 'locked') return 'bg-gray-100 border-gray-300 opacity-60';
              if (fee.color === 'red') return 'bg-red-50 border-red-300';
              if (fee.color === 'yellow') return 'bg-yellow-50 border-yellow-300';
              return 'bg-gray-50 border-gray-200';
            };

            return (
              <motion.div
                key={fee.semester}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-5 rounded-xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl ${getColorClasses()} ${
                  fee.locked ? 'cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-lg">{fee.semester}</span>
                    {fee.locked && (
                      <LockClosedIcon className="h-5 w-5 text-gray-500" title="Complete previous semester payment to unlock" />
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full shadow-md ${
                    fee.status === 'paid'
                      ? 'bg-green-500'
                      : fee.status === 'pending' && fee.color === 'red'
                      ? 'bg-red-500 animate-pulse'
                      : fee.status === 'pending' && fee.color === 'yellow'
                      ? 'bg-yellow-500 animate-pulse'
                      : fee.status === 'locked'
                      ? 'bg-gray-400'
                      : 'bg-gray-300'
                  }`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{fee.amount.toLocaleString()}
                  </span>
                  {fee.status === 'paid' ? (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-7 w-7 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">PAID</span>
                    </div>
                  ) : fee.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-7 w-7 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700">PENDING</span>
                    </div>
                  ) : fee.status === 'locked' ? (
                    <div className="flex items-center gap-2">
                      <LockClosedIcon className="h-7 w-7 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600">LOCKED</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">N/A</span>
                  )}
                </div>
                {fee.locked && fee.amount > 0 && (
                  <p className="text-xs text-gray-600 mt-3 italic">
                    Complete SEM-{fee.semester_number - 1} payment first
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Payment Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Make Payment</h2>
        
        {/* Mandatory First Semester Payment - Highlighted */}
        {semesterFees.find(fee => fee.mandatory && fee.status === 'pending') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-6 bg-red-50 border-2 border-red-400 rounded-2xl shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-white font-bold text-lg">!</span>
              </motion.div>
              <h3 className="text-xl font-bold text-red-900"> MANDATORY: First Semester Payment Required</h3>
            </div>
            <p className="text-red-800 mb-5 text-base leading-relaxed">
              First semester fee payment is <span className="font-bold">mandatory</span> to unlock and access the complete student portal features including ID Card, Profile, Study Materials, Video Lessons, Assignments, and Feedback sections.
            </p>
            {(() => {
              const firstSem = semesterFees.find(fee => fee.semester === 'SEM - 1');
              return (
                <button
                  onClick={() => handlePayment(firstSem.semester, firstSem.amount)}
                  disabled={processingPayment}
                  className="w-full px-6 py-4 bg-red-600 text-white font-bold text-xl hover:bg-red-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {processingPayment ? (
                    <div className="flex items-center justify-center gap-3 relative">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <CreditCardIcon className="h-7 w-7" />
                      Pay First Semester Fee - ₹{firstSem.amount.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })()}
          </motion.div>
        )}

        {/* Unlocked Semester Payments */}
        <div className="space-y-4">
          {semesterFees
            .filter(fee => fee.status === 'pending' && fee.amount > 0 && !fee.mandatory)
            .map((fee, index) => {
              const gradientClass = fee.color === 'yellow' 
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-blue-50 border-blue-300';
              const buttonClass = fee.color === 'yellow'
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-blue-500 hover:bg-blue-600';
              const iconBgClass = fee.color === 'yellow'
                ? 'bg-yellow-500'
                : 'bg-blue-500';

              return (
                <motion.div
                  key={fee.semester}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-5 bg-gradient-to-r ${gradientClass} rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`w-12 h-12 ${iconBgClass} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <CreditCardIcon className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{fee.semester} Fee Payment</h3>
                      <p className="text-sm text-gray-700 font-medium">Amount: ₹{fee.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-600 mt-1"> Unlocked & Ready to Pay</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePayment(fee.semester, fee.amount)}
                    disabled={processingPayment}
                    className={`px-8 py-3 ${buttonClass} text-white rounded-xl font-bold text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processingPayment ? 'Processing...' : 'Pay Now'}
                  </motion.button>
                </motion.div>
              );
            })}
        </div>

        {/* Locked Semester Payments */}
        {semesterFees.filter(fee => fee.status === 'locked' && fee.amount > 0).length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5" />
              Locked Semester Payments
            </h3>
            {semesterFees
              .filter(fee => fee.status === 'locked' && fee.amount > 0)
              .map((fee, index) => (
                <motion.div
                  key={fee.semester}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-5 bg-gray-100 rounded-2xl border-2 border-gray-300 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center shadow-lg">
                      <LockClosedIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-700 text-lg">{fee.semester} Fee Payment</h3>
                      <p className="text-sm text-gray-600 font-medium">Amount: ₹{fee.amount.toLocaleString()}</p>
                      <p className="text-xs text-red-600 mt-1 font-semibold">
                         Complete SEM-{fee.semester_number - 1} payment to unlock
                      </p>
                    </div>
                  </div>
                  <div className="px-8 py-3 bg-gray-300 text-gray-600 rounded-xl font-bold text-base">
                    Locked
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        {semesterFees.filter(fee => fee.status === 'pending' && fee.amount > 0).length === 0 && (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Payments Completed!</h3>
            <p className="text-gray-600">You have successfully paid all applicable semester fees.</p>
          </div>
        )}
      </motion.div>

      {/* Payment History & Receipts */}
      {Object.keys(paymentReceipts).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History & Receipts</h2>
          <div className="space-y-4">
            {Object.entries(paymentReceipts).map(([semester, receipt], index) => (
              <motion.div
                key={semester}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <DocumentArrowDownIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{receipt.semester} Fee Payment</h3>
                    <p className="text-sm text-gray-600">Paid on {receipt.paymentDate} • ₹{receipt.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Transaction ID: {receipt.transactionId}</p>
                  </div>
                </div>
                <ReceiptDownload
                  paymentData={receipt}
                  fileName={`Periyar_University_${receipt.semester}_Receipt_${receipt.receiptNumber}.pdf`}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Important Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-300 p-8 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">ℹ️</span>
          </div>
          Important Payment Information
        </h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-300 shadow-md">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0 shadow-lg"></div>
            <div>
              <p className="font-bold text-red-900 text-base mb-2">🔴 MANDATORY: First Semester Payment Required</p>
              <p className="text-red-800 leading-relaxed">Payment of ₹20,000 for the first semester is <span className="font-bold">mandatory</span> to unlock and access the complete student portal including ID Card, Profile, Study Materials, Video Lessons, Assignments, and Feedback sections.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300 shadow-md">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 flex-shrink-0 shadow-lg"></div>
            <div>
              <p className="font-bold text-yellow-900 text-base mb-2">🔓 Progressive Unlock System</p>
              <p className="text-yellow-800 leading-relaxed">Semester payments unlock one-by-one in sequence. You must complete the previous semester's payment before the next semester becomes available for payment. This ensures systematic payment progression.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-blue-200">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="leading-relaxed"><span className="font-semibold">Payment Sequence:</span> SEM-1 (Red) → SEM-2 (Yellow) → SEM-3 (Yellow) → SEM-4 (Yellow). Each semester unlocks only after the previous one is paid.</p>
          </div>

          <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-blue-200">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="leading-relaxed"><span className="font-semibold">Enrollment Status:</span> Semester fees must be paid before the start of each semester to maintain active enrollment status.</p>
          </div>
          
          <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-blue-200">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="leading-relaxed"><span className="font-semibold">Late Payments:</span> Late payment fees may apply after the due date. Please check your email regularly for payment deadlines and reminders.</p>
          </div>
          
          <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-blue-200">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="leading-relaxed"><span className="font-semibold">Secure Payments:</span> All payments are processed securely through our encrypted payment gateway. Digital receipts are automatically sent to your registered email.</p>
          </div>
          
          <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-blue-200">
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="leading-relaxed"><span className="font-semibold">Support:</span> For any payment-related queries, contact the accounts department or use the feedback section in your student portal.</p>
          </div>
        </div>
      </motion.div>

      {/* Payment Gateway Modal */}
      <PaymentGateway
        isOpen={paymentGatewayOpen}
        onClose={() => setPaymentGatewayOpen(false)}
        semester={currentPayment?.semester}
        amount={currentPayment?.amount}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default SemesterPayments;