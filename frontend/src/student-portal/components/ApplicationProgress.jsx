import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const ApplicationProgress = () => {
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

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
      console.error('Error fetching application status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine dynamic stages based on application data
  const getDynamicStages = () => {
    if (!applicationData) return [];

    const application = applicationData.application;
    const isPaid = application.payment_status === 'P';
    const isEligibilityVerified = verificationStatus?.eligibility_verified || false;
    const eligibilityStatus = verificationStatus?.eligibility_status || 'Pending';
    const isAdmissionConfirmed = verificationStatus?.admission_confirmed || false;
    const enrollmentNo = verificationStatus?.enrollment_no;
    const isRejected = eligibilityStatus === 'Not Eligible';
    
    return [
      {
        id: 1,
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted to the system',
        icon: DocumentCheckIcon,
        status: 'completed',
        color: 'green',
      },
      {
        id: 2,
        title: 'Payment Verified',
        description: 'Application fee payment has been confirmed',
        icon: CheckCircleIcon,
        status: isPaid ? 'completed' : 'pending',
        color: isPaid ? 'green' : 'gray',
      },
      {
        id: 3,
        title: 'Eligibility Verification',
        description: isRejected 
          ? 'Your application has been marked as Not Eligible' 
          : isEligibilityVerified
          ? 'Your eligibility has been verified and approved'
          : 'LSC admin is reviewing your eligibility and documents',
        icon: DocumentMagnifyingGlassIcon,
        status: isRejected ? 'rejected' : (isEligibilityVerified ? 'completed' : (isPaid ? 'in-progress' : 'pending')),
        color: isRejected ? 'red' : (isEligibilityVerified ? 'green' : (isPaid ? 'blue' : 'gray')),
        statusText: eligibilityStatus,
      },
      {
        id: 4,
        title: 'Admission Confirmation',
        description: isAdmissionConfirmed
          ? 'Your admission has been confirmed'
          : isEligibilityVerified
          ? 'Waiting for final admission confirmation'
          : 'Pending eligibility verification',
        icon: AcademicCapIcon,
        status: isAdmissionConfirmed ? 'completed' : (isEligibilityVerified ? 'in-progress' : 'pending'),
        color: isAdmissionConfirmed ? 'green' : (isEligibilityVerified ? 'blue' : 'gray'),
      },
      {
        id: 5,
        title: 'Enrollment Number',
        description: enrollmentNo 
          ? `Your enrollment number: ${enrollmentNo}`
          : 'Enrollment number will be generated after admission confirmation',
        icon: ShieldCheckIcon,
        status: enrollmentNo ? 'completed' : 'pending',
        color: enrollmentNo ? 'green' : 'gray',
        enrollmentNo: enrollmentNo,
      },
    ];
  };

  const stages = getDynamicStages();

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        bgColor: 'bg-green-100',
        borderColor: 'border-green-500',
        textColor: 'text-green-700',
        iconBg: 'bg-green-500',
        icon: CheckCircleIcon,
      },
      'in-progress': {
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
        iconBg: 'bg-blue-500',
        icon: ClockIcon,
      },
      pending: {
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300',
        textColor: 'text-gray-600',
        iconBg: 'bg-gray-400',
        icon: ClockIcon,
      },
      rejected: {
        bgColor: 'bg-red-100',
        borderColor: 'border-red-500',
        textColor: 'text-red-700',
        iconBg: 'bg-red-500',
        icon: XCircleIcon,
      },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Status Tracker</h1>
        <p className="text-gray-600">
          Track your application progress in real-time
        </p>
        {applicationData?.application?.application_id && (
          <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-indigo-700">Application ID:</span>
            <span className="text-sm font-mono font-bold text-indigo-900">
              {applicationData.application.application_id}
            </span>
          </div>
        )}
      </motion.div>

      {/* Progress Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Progress stages */}
        <div className="space-y-8">
          {stages.map((stage, index) => {
            const config = getStatusConfig(stage.status);
            const StageIcon = stage.icon;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Stage indicator */}
                <div className={`absolute left-0 w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center border-4 border-white shadow-lg z-10`}>
                  <StageIcon className="h-8 w-8 text-white" />
                </div>

                {/* Stage content */}
                <div className={`ml-24 p-6 rounded-xl border-2 ${config.borderColor} ${config.bgColor} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-bold ${config.textColor}`}>
                          {stage.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                          <StatusIcon className="h-4 w-4" />
                          {stage.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {stage.description}
                      </p>

                      {/* Additional info for in-progress stage */}
                      {stage.status === 'in-progress' && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-pulse flex space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-200"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-400"></div>
                            </div>
                            <p className="text-xs font-medium text-blue-700">
                              {stage.id === 3 ? 'LSC admin is currently reviewing your documents...' : 'Under review by admission committee...'}
                            </p>
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            Estimated completion: 2-3 business days
                          </p>
                        </div>
                      )}

                      {/* Verification details for completed document verification */}
                      {stage.id === 3 && stage.status === 'completed' && stage.verifiedBy && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-medium text-green-700 mb-2">
                            ✓ Documents verified successfully
                          </p>
                          {stage.verifiedBy && (
                            <p className="text-xs text-green-600">
                              Verified by: <span className="font-semibold">{stage.verifiedBy}</span>
                            </p>
                          )}
                          {stage.verifiedDate && (
                            <p className="text-xs text-green-600">
                              Date: {new Date(stage.verifiedDate).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                          {stage.comments && (
                            <p className="text-xs text-green-600 mt-1">
                              Comments: {stage.comments}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Rejection details */}
                      {stage.status === 'rejected' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-bold text-red-700 mb-2">
                            ⚠ Action Required: Documents Rejected
                          </p>
                          {stage.comments && (
                            <p className="text-xs text-red-600 mb-2">
                              Reason: {stage.comments}
                            </p>
                          )}
                          <p className="text-xs text-red-600">
                            Please resubmit the required documents through the document resubmission page.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <DocumentCheckIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Important Information</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>You will receive email notifications at each stage of the verification process</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>Document verification by LSC admin typically takes 2-3 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>If your documents are rejected, you can resubmit them through the document resubmission page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>Contact support if the verification process takes longer than expected</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>
                  Support Email:{' '}
                  <a href="mailto:cdoe@periyaruniversity.ac.in" className="text-indigo-600 font-semibold hover:underline">
                    cdoe@periyaruniversity.ac.in
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApplicationProgress;