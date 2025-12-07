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
  EnvelopeIcon,
  EyeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { generateApplicationFormPDF } from '../utils/applicationFormPDFGenerator';

const ApplicationDownloadDashboard = () => {
  const [applicationData, setApplicationData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
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

      // Fetch both application data and verification status
      const [appResponse, profileResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/application-payment-data/', {
          headers: { Authorization: `Token ${token}` }
        }),
        axios.get('http://localhost:8000/api/user-profile/', {
          headers: { Authorization: `Token ${token}` }
        })
      ]);

      if (appResponse.data.status === 'success') {
        setApplicationData(appResponse.data.data);
      }

      if (profileResponse.data.status === 'success') {
        const profile = profileResponse.data.data;
        setVerificationStatus({
          eligibility_verified: profile.eligibility_verified,
          eligibility_status: profile.eligibility_status,
          admission_confirmed: profile.admission_confirmed,
          enrollment_no: profile.enrollment_no,
          application_id: profile.application_id
        });
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
      toast.error('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      const loadingToast = toast.loading('Opening application preview...');

      const response = await axios.get(
        'http://localhost:8000/api/download-application/',
        {
          headers: { Authorization: `Token ${token}` },
          responseType: 'json',
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success('Opening preview...');
        // Open in new tab for viewing with complete details
        generateApplicationFormPDF(response.data.data, 'preview');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error opening preview:', error);
      toast.error(error.response?.data?.message || 'Failed to open preview');
    }
  };

  const handleDirectDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      const loadingToast = toast.loading('Preparing print preview...');

      const response = await axios.get(
        'http://localhost:8000/api/download-application-pdf/',
        {
          headers: { Authorization: `Token ${token}` },
          responseType: 'json',
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success('Opening print preview...');
        // Open print preview with complete details
        generateApplicationFormPDF(response.data.data, 'download');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error opening print preview:', error);
      toast.error(error.response?.data?.message || 'Failed to open print preview');
    }
  };

  const handleEmailApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again.');
        return;
      }

      if (!applicationData?.student?.email) {
        toast.error('Email address not found');
        return;
      }

      const loadingToast = toast.loading('Sending application to your email...');

      // Use the download API and send via email in backend
      const response = await axios.post(
        'http://localhost:8000/api/send-application-email/',
        { email: applicationData.student.email },
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      if (response.data.status === 'success') {
        toast.dismiss(loadingToast);
        toast.success(`Application sent to ${applicationData.student.email}!`);
      } else {
        toast.dismiss(loadingToast);
        toast.error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error emailing application:', error);
      
      // If endpoint doesn't exist, show helpful message
      if (error.response?.status === 404) {
        toast.error('Email feature is not available yet. Please use Download instead.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send email');
      }
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
  const isEligibilityVerified = verificationStatus?.eligibility_verified || false;
  const isAdmissionConfirmed = verificationStatus?.admission_confirmed || false;
  const canDownload = isPaid && (isEligibilityVerified || isAdmissionConfirmed);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <DocumentTextIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Download Application</h1>
            <p className="text-gray-600 mt-1">Get your completed application form in PDF format</p>
          </div>
        </div>
      </motion.div>

      {/* Payment Status Banner */}
      {!isPaid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl border-2 mb-6 shadow-lg bg-orange-50 border-orange-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-orange-500">
              <DocumentCheckIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-orange-700">Payment Required</h2>
              <p className="text-sm mt-1 text-orange-600">
                Complete payment to proceed with document verification
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Verification Status Banners */}
      {isPaid && !isEligibilityVerified && !isAdmissionConfirmed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl border-2 mb-6 shadow-lg bg-yellow-50 border-yellow-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-yellow-500">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-yellow-700">Eligibility Verification Pending</h2>
              <p className="text-sm mt-1 text-yellow-600">
                Your documents are under review by the LSC admin. Download will be available once eligibility is verified.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Eligibility Verified but Admission Pending */}
      {isPaid && isEligibilityVerified && !isAdmissionConfirmed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl border-2 mb-6 shadow-lg bg-blue-50 border-blue-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-blue-500">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-blue-700">Eligibility Verified - Awaiting Admission</h2>
              <p className="text-sm mt-1 text-blue-600">
                Your eligibility has been verified. Waiting for final admission confirmation.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Admission Confirmed Banner */}
      {isAdmissionConfirmed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl border-2 mb-6 shadow-lg bg-green-50 border-green-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-green-500">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-green-700">Admission Confirmed - Ready to Download</h2>
              <p className="text-sm mt-1 text-green-600">
                Your admission has been confirmed. You can now download your application form.
              </p>
              {verificationStatus?.enrollment_no && (
                <p className="text-sm mt-2 font-semibold text-green-700">
                  Enrollment No: {verificationStatus.enrollment_no}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Application Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6"
      >
        {/* Card Header */}
        <div className="bg-blue-600 p-6">
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
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <IdentificationIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Application ID</p>
                  <p className="font-mono text-lg font-bold text-blue-600">
                    {applicationData.application.application_id}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <DocumentTextIcon className="h-6 w-6 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Student Name</p>
                  <p className="text-base font-bold text-gray-900">
                    {applicationData.student.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
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
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Verification Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                    canDownload
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : isPaid
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-orange-100 text-orange-700 border border-orange-300'
                  }`}>
                    {canDownload ? 'VERIFIED' : isPaid ? 'PENDING VERIFICATION' : 'PENDING PAYMENT'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
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

              <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
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
        {/* View Application Card */}
        <motion.div
          whileHover={{ scale: canDownload ? 1.03 : 1 }}
          className={`bg-indigo-600 rounded-xl shadow-xl p-6 text-white relative overflow-hidden group ${
            canDownload
              ? 'cursor-pointer'
              : 'opacity-60 cursor-not-allowed'
          }`}
          onClick={canDownload ? handleViewApplication : null}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <EyeIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">View Application</h3>
            <p className="text-sm text-indigo-100 mb-4">
              {canDownload
                ? 'Preview your application form online'
                : !isPaid
                ? 'Available after payment'
                : 'Available after verification'}
            </p>
            {canDownload ? (
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
          whileHover={{ scale: canDownload ? 1.03 : 1 }}
          className={`bg-blue-600 rounded-xl shadow-xl p-6 text-white relative overflow-hidden group ${
            canDownload
              ? 'cursor-pointer'
              : 'opacity-60 cursor-not-allowed'
          }`}
          onClick={canDownload ? handleDirectDownload : null}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <ArrowDownTrayIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Print/Save PDF</h3>
            <p className="text-sm text-blue-100 mb-4">
              {canDownload
                ? 'Opens print preview to save as PDF'
                : !isPaid
                ? 'Available after payment'
                : 'Available after verification'}
            </p>
            {canDownload ? (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>Open Print Preview</span>
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

        {/* Email Application Card */}
        <motion.div
          whileHover={{ scale: canDownload ? 1.03 : 1 }}
          className={`bg-green-600 rounded-xl shadow-xl p-6 text-white relative overflow-hidden group ${
            canDownload
              ? 'cursor-pointer'
              : 'opacity-60 cursor-not-allowed'
          }`}
          onClick={canDownload ? handleEmailApplication : null}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <EnvelopeIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Email Copy</h3>
            <p className="text-sm text-green-100 mb-4">
              {canDownload
                ? 'Send application details to your email'
                : !isPaid
                ? 'Available after payment'
                : 'Available after verification'}
            </p>
            {canDownload ? (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>Send Email</span>
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
      {canDownload && (
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