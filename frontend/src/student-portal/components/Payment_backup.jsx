import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Toaster, toast } from 'react-hot-toast';
import {
  ArrowLeftIcon, // Added missing import
  CheckCircleIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const Payment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState({
    active: [], // Pending (payment_status='created')
    opened: [], // Also treated as Pending (payment_status='created')
    closed: [], // Completed (payment_status='success')
    cancelled: [], // Cancelled (payment_status='cancelled')
    failed: [], // Failed (payment_status='failed')
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to view payment history.');
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:8000/api/get-application/', {
          headers: { Authorization: `Token ${token}` },
        });
        console.log('API Response:', response.data); // Debug response
        if (response.data.status === 'success') {
          if (
            response.data.data.active.length === 0 &&
            response.data.data.opened.length === 0 &&
            response.data.data.closed.length === 0 &&
            response.data.data.cancelled.length === 0 &&
            response.data.data.failed?.length === 0
          ) {
            console.warn('No payments found in response data');
          }
          // Combine active and opened as "Pending"
          const combinedPending = [
            ...(response.data.data.active || []),
            ...(response.data.data.opened || []),
          ];
          setPayments({
            active: combinedPending, // Pending payments
            closed: response.data.data.closed || [],
            cancelled: response.data.data.cancelled || [],
            failed: response.data.data.failed || [],
          });
        } else {
          toast.error('Failed to fetch payment history.');
          setError('Failed to fetch payment history.');
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        toast.error('An error occurred while fetching payment history.');
        setError('An error occurred while fetching payment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [navigate]);

  const generatePDF = (payment) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Payment Receipt', 105, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Your Institution Name', 10, 10);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleString()}`, 190, 50, '');

      autoTable(doc, {
        startY: 60,
        head: [['Field', 'Details']],
        body: [
          ['Application ID', payment.id],
          ['Name', payment.name || 'N/A'],
          ['Email', payment.email || 'N/A'],
          ['Transaction ID', payment.transaction_id || 'N/A'],
          ['Course', payment.course || 'N/A'],
          ['Amount Paid', payment.amount_paid ? `₹${payment.amount_paid.toFixed(2)}` : 'N/A'],
          ['Status', payment.status === 'success' ? 'Completed' : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)],
          ['Created At', payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A'], // Add created_at
        ],
        styles: {
          fontSize: 10,
          cellPadding: 4,
          textColor: [33, 33, 33],
          lineColor: [209, 213, 219],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontSize: 12,
        },
        margin: { top: 10, left: 10, right: 10 },
      });

      doc.setFillColor(243, 244, 246);
      doc.rect(0, 270, 210, 27, 'F');
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.text('Contact: support@institution.com | www.institution.com', 105, 290, { align: 'center' });

      doc.save(`Receipt_${payment.id}.pdf`);
      toast.success('Receipt downloaded successfully!', { duration: 3000 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'cancelled':
      case 'created':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <SparklesIcon className="h-5 w-5 text-indigo-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <style>
        {`
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.3); }
            50% { box-shadow: 0 0 25px rgba(124, 58, 237, 0.5); }
          }
          .animate-glow { animation: glow 2.5s ease-in-out infinite; }
          .glassmorphism {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          .btn-gradient {
            background: linear-gradient(90deg, #4B0082, #6B21A8, #DB2777);
          }
        `}
      </style>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          className="mt-6 bg-gradient-to-br from-white/20 to-indigo-200/20 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border-2 border-gradient text-center w-full glassmorphism"
          whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
        >
          <Toaster position="top-right" />
          <h2 className="text-4xl font-extrabold text-indigo-900 mb-6 font-poppins tracking-tight">
            Payment History
          </h2>
          <p className="text-lg font-lato font-normal text-gray-800 leading-relaxed mb-6">
            View the status of all your payments below.
          </p>

          {loading ? (
            <motion.div
              className="text-center text-gray-600 font-medium p-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Loading payment history...
            </motion.div>
          ) : error ? (
            <p className="text-lg font-lato font-normal text-red-600 mt-4">{error}</p>
          ) : payments.active.length === 0 && payments.closed.length === 0 && payments.cancelled.length === 0 && payments.failed.length === 0 ? (
            <p className="text-lg font-lato font-normal text-gray-800 mt-4">No payments found.</p>
          ) : (
            <>
              {/* Pending Payments */}
              {payments.active.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-indigo-700 mb-4 font-poppins">Pending Payments</h4>
                  {payments.active.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-6 bg-white/95 rounded-xl shadow-lg mb-4 border border-indigo-300/20"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                        {[
                          { label: 'Application ID', value: payment.id },
                          { label: 'Name', value: payment.name || 'N/A' },
                          { label: 'Email', value: payment.email || 'N/A' },
                          { label: 'Status', value: 'Pending' },
                          { label: 'Course', value: payment.course || 'N/A' },
                          { label: 'Transaction ID', value: payment.transaction_id || 'N/A' },
                          { label: 'Amount', value: payment.amount_paid ? `₹${payment.amount_paid.toFixed(2)}` : 'N/A' },
                          { label: 'Created At', value: payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center space-x-2">
                            {getStatusIcon(payment.status)}
                            <div>
                              <h5 className="font-semibold text-gray-800 font-roboto text-sm">{item.label}:</h5>
                              <p className="text-gray-600 font-lato text-sm">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Completed Payments */}
              {payments.closed.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-indigo-700 mb-4 font-poppins">Completed Payments</h4>
                  {payments.closed.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-6 bg-white/95 rounded-xl shadow-lg mb-4 border border-indigo-300/20"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                        {[
                          { label: 'Application ID', value: payment.id },
                          { label: 'Name', value: payment.name || 'N/A' },
                          { label: 'Email', value: payment.email || 'N/A' },
                          { label: 'Status', value: 'Completed' },
                          { label: 'Course', value: payment.course || 'N/A' },
                          { label: 'Transaction ID', value: payment.transaction_id || 'N/A' },
                          { label: 'Amount', value: payment.amount_paid ? `₹${payment.amount_paid.toFixed(2)}` : 'N/A' },
                          { label: 'Created At', value: payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center space-x-2">
                            {getStatusIcon(payment.status)}
                            <div>
                              <h5 className="font-semibold text-gray-800 font-roboto text-sm">{item.label}:</h5>
                              <p className="text-gray-600 font-lato text-sm">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {payment.transaction_id && (
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => generatePDF(payment)}
                          className="mt-4 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-lato font-semibold text-base flex items-center space-x-2"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                          <span>Download Receipt</span>
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Cancelled Payments */}
              {payments.cancelled.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-indigo-700 mb-4 font-poppins">Cancelled Payments</h4>
                  {payments.cancelled.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-6 bg-white/95 rounded-xl shadow-lg mb-4 border border-indigo-300/20"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                        {[
                          { label: 'Application ID', value: payment.id },
                          { label: 'Name', value: payment.name || 'N/A' },
                          { label: 'Email', value: payment.email || 'N/A' },
                          { label: 'Status', value: 'Cancelled' },
                          { label: 'Course', value: payment.course || 'N/A' },
                          { label: 'Transaction ID', value: payment.transaction_id || 'N/A' },
                          { label: 'Amount', value: payment.amount_paid ? `₹${payment.amount_paid.toFixed(2)}` : 'N/A' },
                          { label: 'Created At', value: payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center space-x-2">
                            {getStatusIcon(payment.status)}
                            <div>
                              <h5 className="font-semibold text-gray-800 font-roboto text-sm">{item.label}:</h5>
                              <p className="text-gray-600 font-lato text-sm">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Failed Payments */}
              {payments.failed.length > 0 && (
                <div>
                  <h4 className="text-xl font-semibold text-indigo-700 mb-4 font-poppins">Failed Payments</h4>
                  {payments.failed.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-6 bg-white/95 rounded-xl shadow-lg mb-4 border border-indigo-300/20"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                        {[
                          { label: 'Application ID', value: payment.id },
                          { label: 'Name', value: payment.name || 'N/A' },
                          { label: 'Email', value: payment.email || 'N/A' },
                          { label: 'Status', value: 'Failed' },
                          { label: 'Course', value: payment.course || 'N/A' },
                          { label: 'Transaction ID', value: payment.transaction_id || 'N/A' },
                          { label: 'Amount', value: payment.amount_paid ? `₹${payment.amount_paid.toFixed(2)}` : 'N/A' },
                          { label: 'Created At', value: payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center space-x-2">
                            {getStatusIcon(payment.status)}
                            <div>
                              <h5 className="font-semibold text-gray-800 font-roboto text-sm">{item.label}:</h5>
                              <p className="text-gray-600 font-lato text-sm">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
            <style jsx>{`
            .font-poppins {
              font-family: 'Poppins', sans-serif !important;
            }
            .font-roboto {
              font-family: 'Roboto', sans-serif !important;
            }
            .font-lato {
              font-family: 'Lato', sans-serif !important;
            }
          `}</style>
        </motion.div>
      </div>
    </div>
  );
};

export default Payment;
