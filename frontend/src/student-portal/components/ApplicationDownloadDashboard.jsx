import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon,
  IdentificationIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  PrinterIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { generateProfessionalApplicationPDF } from '../utils/professionalPdfGenerator';

const ApplicationDownloadDashboard = () => {
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationData();
  }, []);

  const fetchApplicationData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      const response = await axios.get(
        'http://localhost:8000/api/application-payment-data/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        setApplicationData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
      toast.error('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPreview = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      const loadingToast = toast.loading('Opening print preview...');

      const response = await axios.get(
        'http://localhost:8000/api/download-application/',
        {
          headers: { Authorization: `Token ${token}` },
          responseType: 'json',
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success('Print preview opened!');
        generateProfessionalApplicationPDF(response.data.data, 'preview');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error opening print preview:', error);
      toast.error(error.response?.data?.message || 'Failed to open print preview');
    }
  };

  const handleDirectDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      const loadingToast = toast.loading('Generating PDF...');

      const response = await axios.get(
        'http://localhost:8000/api/download-application/',
        {
          headers: { Authorization: `Token ${token}` },
          responseType: 'json',
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success('Downloading application form...');
        generateProfessionalApplicationPDF(response.data.data, 'download');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading application:', error);
      toast.error(error.response?.data?.message || 'Failed to download application');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Application Found</h3>
          <p className="text-gray-600">Complete your application and payment to download your form.</p>
        </div>
      </div>
    );
  }

  const isPaid = applicationData.application.payment_status === 'P';

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <DocumentTextIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Download Application</h1>
            <p className="text-gray-600 mt-1">Get your completed application form in PDF format</p>
          </div>
        </div>
      </motion.div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-xl border-2 mb-6 shadow-lg ${
          isPaid
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500'
            : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-500'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
            isPaid ? 'bg-green-500' : 'bg-orange-500'
          }`}>
            {isPaid ? (
              <CheckCircleIcon className="h-8 w-8 text-white" />
            ) : (
              <DocumentCheckIcon className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${isPaid ? 'text-green-700' : 'text-orange-700'}`}>
              {isPaid ? 'Application Verified & Ready' : 'Payment Required'}
            </h2>
            <p className={`text-sm mt-1 ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
              {isPaid
                ? 'Your application has been verified and is ready for download'
                : 'Complete payment to unlock application download'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Application Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6"
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <IdentificationIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Application Information</h3>
              <p className="text-sm text-blue-100">Your submitted application details</p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <IdentificationIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Application ID</p>
                  <p className="font-mono text-lg font-bold text-blue-600">
                    {applicationData.application.application_id}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-50 rounded-lg border border-purple-200">
                <DocumentTextIcon className="h-6 w-6 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Student Name</p>
                  <p className="text-base font-bold text-gray-900">
                    {applicationData.student.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg border border-indigo-200">
                <AcademicCapIcon className="h-6 w-6 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Course Applied</p>
                  <p className="text-base font-bold text-gray-900">
                    {applicationData.application.mode_of_study}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                    isPaid
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-orange-100 text-orange-700 border border-orange-300'
                  }`}>
                    {isPaid ? 'VERIFIED' : 'PENDING PAYMENT'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <CalendarIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Submission Date</p>
                  <p className="text-base font-bold text-gray-900">
                    {new Date().toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-lg border border-rose-200">
                <DocumentCheckIcon className="h-6 w-6 text-rose-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {applicationData.student.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Download Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Print Preview Card */}
        <motion.div
          whileHover={{ scale: isPaid ? 1.03 : 1 }}
          className={`bg-gradient-to-br rounded-xl shadow-xl p-6 text-white relative overflow-hidden group ${
            isPaid
              ? 'from-indigo-600 to-purple-600 cursor-pointer'
              : 'from-gray-400 to-gray-500 cursor-not-allowed'
          }`}
          onClick={isPaid ? handlePrintPreview : null}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <EyeIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Print Preview</h3>
            <p className="text-sm text-indigo-100 mb-4">
              {isPaid
                ? 'View and print your application form'
                : 'Available after payment'}
            </p>
            {isPaid ? (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>Open Preview</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </div>
            ) : (
              <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                LOCKED
              </span>
            )}
          </div>
        </motion.div>

        {/* Direct Download Card */}
        <motion.div
          whileHover={{ scale: isPaid ? 1.03 : 1 }}
          className={`bg-gradient-to-br rounded-xl shadow-xl p-6 text-white relative overflow-hidden group ${
            isPaid
              ? 'from-blue-600 to-cyan-600 cursor-pointer'
              : 'from-gray-400 to-gray-500 cursor-not-allowed'
          }`}
          onClick={isPaid ? handleDirectDownload : null}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <ArrowDownTrayIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Download PDF</h3>
            <p className="text-sm text-blue-100 mb-4">
              {isPaid
                ? 'Download form directly as PDF file'
                : 'Available after payment'}
            </p>
            {isPaid ? (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>Download Now</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </div>
            ) : (
              <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                LOCKED
              </span>
            )}
          </div>
        </motion.div>

        {/* Print Directly Card */}
        <motion.div
          whileHover={{ scale: isPaid ? 1.03 : 1 }}
          className={`bg-gradient-to-br rounded-xl shadow-xl p-6 text-white relative overflow-hidden group ${
            isPaid
              ? 'from-green-600 to-emerald-600 cursor-pointer'
              : 'from-gray-400 to-gray-500 cursor-not-allowed'
          }`}
          onClick={isPaid ? handlePrintPreview : null}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <PrinterIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Quick Print</h3>
            <p className="text-sm text-green-100 mb-4">
              {isPaid
                ? 'Open print dialog immediately'
                : 'Available after payment'}
            </p>
            {isPaid ? (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>Print Now</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </div>
            ) : (
              <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                LOCKED
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Instructions */}
      {isPaid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl"
        >
          <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <DocumentCheckIcon className="h-5 w-5" />
            Important Instructions
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Download your application form and verify all details are correct</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Print the form on A4 size paper for physical submission if required</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Keep both digital and physical copies safe for future reference</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Submit any additional documents as mentioned in the guidelines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">5.</span>
              <span>Track your application status from the "Application Status" menu</span>
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ApplicationDownloadDashboard;
