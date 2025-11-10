import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const Applications = ({ handleOpenApplication }) => {
  const [applications, setApplications] = useState({
    active: [],
    opened: [],
    closed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'Present' : 'Missing'); // Debug token
        if (!token) {
          toast.error('Please log in to view applications.');
          setLoading(false);
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
            response.data.data.cancelled.length === 0
          ) {
            console.warn('No applications found in response data');
          }
          setApplications(response.data.data);
        } else {
          toast.error('Failed to fetch applications.');
          setError('Failed to fetch applications.');
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('An error occurred while fetching applications.');
        setError('An error occurred while fetching applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const generatePDF = (app) => {
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
          ['Application ID', app.id],
          ['Name', app.name || 'N/A'],
          ['Email', app.email || 'N/A'],
          ['Transaction ID', app.transaction_id || 'N/A'],
          ['Course', app.course || 'N/A'],
          ['Amount Paid', app.amount_paid ? `₹${app.amount_paid.toFixed(2)}` : 'N/A'],
          ['Date', new Date().toLocaleString()],
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

      doc.save(`Receipt_${app.id}.pdf`);
      toast.success('Receipt downloaded successfully!', { duration: 3000 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF.');
    }
  };

  // Handle View Details navigation
  const handleViewDetails = (appId) => {
    navigate(`/dashboard/view/${appId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      className="mt-6 bg-gradient-to-br from-white/20 to-indigo-200/20 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border-2 border-gradient text-center w-full max-w-5xl mx-auto glassmorphism"
      whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
    >
      <Toaster position="top-right" />
      <h3 className="text-3xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-tight">
        Your Applications
      </h3>
      <p className="text-lg font-lato font-normal text-gray-800 leading-relaxed mb-6">
        View the status of your submitted and completed applications here.
      </p>

      {loading ? (
        <p className="text-lg font-lato font-normal text-gray-800 mt-4">Loading applications...</p>
      ) : error ? (
        <p className="text-lg font-lato font-normal text-red-600 mt-4">{error}</p>
      ) : applications.active.length === 0 && applications.closed.length === 0 && applications.opened.length === 0 && applications.cancelled.length === 0 ? (
        <p className="text-lg font-lato font-normal text-gray-800 mt-4">No applications submitted yet.</p>
      ) : (
        <>
          {applications.active.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-indigo-700 mb-4 font-poppins">In Progress Applications</h4>
              {applications.active.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 bg-white/95 rounded-xl shadow-lg mb-4 border border-indigo-300/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    {[
                      { label: 'Application ID', value: app.id },
                      { label: 'Name', value: app.name || 'N/A' },
                      { label: 'Email', value: app.email || 'N/A' },
                      { label: 'Status', value: app.status === 'success' ? 'Completed' : app.status.charAt(0).toUpperCase() + app.status.slice(1) },
                      { label: 'Course', value: app.course || 'N/A' },
                      { label: 'Transaction ID', value: app.transaction_id || 'N/A' },
                      { label: 'Amount Paid', value: app.amount_paid ? `₹${app.amount_paid.toFixed(2)}` : 'N/A' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center space-x-2">
                        <SparklesIcon className="h-5 w-5 text-indigo-600" />
                        <div>
                          <h5 className="font-semibold text-gray-800 font-roboto text-sm">{item.label}:</h5>
                          <p className="text-gray-600 font-lato text-sm">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewDetails(app.id)} // Updated to use new handler
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 text-white rounded-xl font-lato font-semibold text-base btn-gradient"
                  >
                    View Details
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}

          {applications.closed.length > 0 && (
            <div>
              <h4 className="text-xl font-semibold text-indigo-700 mb-4 font-poppins">Completed Applications</h4>
              {applications.closed.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 bg-white/95 rounded-xl shadow-lg mb-4 border border-indigo-300/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    {[
                      { label: 'Application ID', value: app.id },
                      { label: 'Name', value: app.name || 'N/A' },
                      { label: 'Email', value: app.email || 'N/A' },
                      { label: 'Status', value: app.status === 'success' ? 'Completed' : app.status.charAt(0).toUpperCase() + app.status.slice(1) },
                      { label: 'Course', value: app.course || 'N/A' },
                      { label: 'Transaction ID', value: app.transaction_id || 'N/A' },
                      { label: 'Amount Paid', value: app.amount_paid ? `₹${app.amount_paid.toFixed(2)}` : 'N/A' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center space-x-2">
                        <SparklesIcon className="h-5 w-5 text-indigo-600" />
                        <div>
                          <h5 className="font-semibold text-gray-800 font-roboto text-sm">{item.label}:</h5>
                          <p className="text-gray-600 font-lato text-sm">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleViewDetails(app.id)} // Updated to use new handler
                      className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 text-white rounded-xl font-lato font-semibold text-base btn-gradient"
                    >
                      View Details
                    </motion.button>
                    {app.transaction_id && (
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => generatePDF(app)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-lato font-semibold text-base flex items-center space-x-2"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        <span>Download Receipt</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {applications.cancelled.length > 0 && (
            <div>
              <h4 className="text-xl font-semibold text-indigo-700 mb-4 font-poppins">Cancelled Applications</h4>
              {applications.cancelled.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 bg-white/95 rounded-xl shadow-lg mb-4 border border-indigo-300/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    {[
                      { label: 'Application ID', value: app.id },
                      { label: 'Name', value: app.name || 'N/A' },
                      { label: 'Email', value: app.email || 'N/A' },
                      { label: 'Status', value: app.status === 'success' ? 'Completed' : app.status.charAt(0).toUpperCase() + app.status.slice(1) },
                      { label: 'Course', value: app.course || 'N/A' },
                      { label: 'Transaction ID', value: app.transaction_id || 'N/A' },
                      { label: 'Amount Paid', value: app.amount_paid ? `₹${app.amount_paid.toFixed(2)}` : 'N/A' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center space-x-2">
                        <SparklesIcon className="h-5 w-5 text-indigo-600" />
                        <div>
                          <h5 className="font-semibold text-gray-800 font-roboto text-sm">{item.label}:</h5>
                          <p className="text-gray-600 font-lato text-sm">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewDetails(app.id)} // Updated to use new handler
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 text-white rounded-xl font-lato font-semibold text-base btn-gradient"
                  >
                    View Details
                  </motion.button>
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
  );
};

export default Applications;