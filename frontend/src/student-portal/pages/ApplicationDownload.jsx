import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Toaster, toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const ApplicationDownload = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to view your application.');
          navigate('/student/login');
          return;
        }

        const response = await axios.get('http://localhost:8000/api/get-autofill-application/', {
          headers: { Authorization: `Token ${token}` },
        });

        if (response.data.status === 'success') {
          setApplicationData(response.data.data);
        } else {
          setError('Failed to fetch application data');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        setError('An error occurred while fetching your application');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [navigate, applicationId]);

  const generateApplicationPDF = () => {
    try {
      if (!applicationData) return;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Modern Header with Gradient Effect
      doc.setFillColor(79, 70, 229); // Indigo
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // University Logo Area (placeholder)
      doc.setFillColor(255, 255, 255);
      doc.circle(20, 22, 12, 'F');
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PU', 20, 24, { align: 'center' });

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PERIYAR UNIVERSITY', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Centre for Distance & Online Education', pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(9);
      doc.text('Application Receipt', pageWidth / 2, 36, { align: 'center' });

      // Application ID Badge
      const badgeY = 55;
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(pageWidth / 2 - 50, badgeY, 100, 18, 3, 3, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.roundedRect(pageWidth / 2 - 50, badgeY, 100, 18, 3, 3, 'S');
      
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('APPLICATION ID', pageWidth / 2, badgeY + 8, { align: 'center' });
      doc.setFontSize(14);
      doc.text(applicationId || 'N/A', pageWidth / 2, badgeY + 15, { align: 'center' });

      // Date and Status
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated: ${currentDate}`, pageWidth - 15, badgeY + 25, { align: 'right' });
      
      // Payment Status Badge
      doc.setFillColor(34, 197, 94);
      doc.circle(15, badgeY + 23, 3, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT VERIFIED', 20, badgeY + 25);

      // Student Information Section
      let currentY = 95;
      doc.setFillColor(249, 250, 251);
      doc.rect(15, currentY, pageWidth - 30, 12, 'F');
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('👤 STUDENT INFORMATION', 20, currentY + 8);

      // Student Details Table
      autoTable(doc, {
        startY: currentY + 15,
        head: [['Field', 'Details']],
        body: [
          ['Full Name', applicationData.name_initial || 'N/A'],
          ['Email Address', applicationData.email || 'N/A'],
          ['Phone Number', applicationData.phone || 'N/A'],
          ['Gender', applicationData.gender || 'N/A'],
          ['Date of Birth', applicationData.dob || 'N/A'],
        ],
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [50, 50, 50],
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold', textColor: [80, 80, 80] },
          1: { cellWidth: 'auto' },
        },
        margin: { left: 15, right: 15 },
        theme: 'grid',
      });

      // Programme Details Section
      currentY = doc.lastAutoTable.finalY + 15;
      doc.setFillColor(249, 250, 251);
      doc.rect(15, currentY, pageWidth - 30, 12, 'F');
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('🎓 PROGRAMME DETAILS', 20, currentY + 8);

      autoTable(doc, {
        startY: currentY + 15,
        head: [['Field', 'Details']],
        body: [
          ['Mode of Study', applicationData.mode_of_study || 'N/A'],
          ['Programme Applied', applicationData.programme_applied || 'N/A'],
          ['Course/Degree', applicationData.course || 'N/A'],
          ['Academic Year', applicationData.academic_year || 'N/A'],
        ],
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [50, 50, 50],
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold', textColor: [80, 80, 80] },
          1: { cellWidth: 'auto' },
        },
        margin: { left: 15, right: 15 },
        theme: 'grid',
      });

      // Payment Information Section
      currentY = doc.lastAutoTable.finalY + 15;
      doc.setFillColor(240, 253, 244);
      doc.rect(15, currentY, pageWidth - 30, 12, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('💳 PAYMENT INFORMATION', 20, currentY + 8);

      autoTable(doc, {
        startY: currentY + 15,
        head: [['Payment Details', 'Status']],
        body: [
          ['Application Fee', '₹236.00'],
          ['Payment Status', '✅ PAID'],
          ['Payment Method', 'Online Payment'],
          ['Transaction Date', currentDate],
          ['Application Status', 'COMPLETED'],
        ],
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [50, 50, 50],
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [22, 163, 74],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold', textColor: [80, 80, 80] },
          1: { cellWidth: 'auto', fontStyle: 'bold', textColor: [22, 163, 74] },
        },
        margin: { left: 15, right: 15 },
        theme: 'grid',
      });

      // Important Note Box
      currentY = doc.lastAutoTable.finalY + 15;
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(15, currentY, pageWidth - 30, 25, 2, 2, 'FD');
      
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('📌 IMPORTANT INSTRUCTIONS', 20, currentY + 8);
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('• Keep this receipt safe for future reference and verification purposes', 20, currentY + 14);
      doc.text('• This is an auto-generated document and does not require a signature', 20, currentY + 19);
      doc.text('• For any queries, contact the admissions office with your Application ID', 20, currentY + 24);

      // Footer
      doc.setFillColor(249, 250, 251);
      doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 24, pageWidth - 15, pageHeight - 24);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Periyar University - Centre for Distance & Online Education', pageWidth / 2, pageHeight - 18, { align: 'center' });
      doc.text('Salem - 636 011, Tamil Nadu, India', pageWidth / 2, pageHeight - 13, { align: 'center' });
      doc.text('📧 admissions@periyaruniversity.ac.in | 🌐 www.periyaruniversity.ac.in | ☎ +91-427-2345766', pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Watermark
      doc.setTextColor(240, 240, 240);
      doc.setFontSize(60);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFIED', pageWidth / 2, pageHeight / 2, { 
        align: 'center',
        angle: 45 
      });

      doc.save(`Application_Receipt_${applicationId}.pdf`);
      toast.success('📄 Application receipt downloaded successfully!', { 
        duration: 4000,
        icon: '✅',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const copyApplicationId = () => {
    navigator.clipboard.writeText(applicationId);
    toast.success('Application ID copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {/* Success Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4"
            >
              <CheckCircleIcon className="h-16 w-16 text-green-600" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-purple-900 mb-2 font-poppins">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600 font-lato">
              Your application has been completed successfully
            </p>
          </div>

          {/* Application ID Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Your Application ID</p>
                <p className="text-3xl font-bold font-mono">{applicationId}</p>
              </div>
              <button
                onClick={copyApplicationId}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition duration-200"
                title="Copy Application ID"
              >
                <ClipboardDocumentCheckIcon className="h-6 w-6" />
              </button>
            </div>
          </motion.div>

          {/* Application Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 rounded-xl p-6"
            >
              <div className="flex items-center mb-4">
                <UserCircleIcon className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-800 font-roboto">Student Details</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Name:</span> {applicationData?.name_initial || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Email:</span> {applicationData?.email || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Gender:</span> {applicationData?.gender || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">DOB:</span> {applicationData?.dob || 'N/A'}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 rounded-xl p-6"
            >
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-800 font-roboto">Programme Details</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Mode:</span> {applicationData?.mode_of_study || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Programme:</span> {applicationData?.programme_applied || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Course:</span> {applicationData?.course || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Year:</span> {applicationData?.academic_year || 'N/A'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateApplicationPDF}
              className="flex-1 flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition duration-200"
            >
              <DocumentArrowDownIcon className="h-6 w-6 mr-2" />
              Download Application Receipt
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/student/dashboard')}
              className="flex-1 flex items-center justify-center px-6 py-4 bg-gray-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-gray-700 transition duration-200"
            >
              <ArrowLeftIcon className="h-6 w-6 mr-2" />
              Back to Dashboard
            </motion.button>
          </div>

          {/* Important Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg"
          >
            <p className="text-sm text-blue-800 font-semibold">
              📝 <strong>Important:</strong> Please save your Application ID ({applicationId}) for future reference. 
              You can download your application receipt anytime from your dashboard.
            </p>
          </motion.div>
        </motion.div>
      </div>

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
    </div>
  );
};

export default ApplicationDownload;
