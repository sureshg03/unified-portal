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

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        'http://localhost:8000/api/application-payment-data/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        setApplicationData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Define application verification stages
  const stages = [
    {
      id: 1,
      title: 'Application Submitted',
      description: 'Your application has been successfully submitted',
      icon: DocumentCheckIcon,
      status: 'completed',
      color: 'green',
    },
    {
      id: 2,
      title: 'Payment Verified',
      description: 'Application fee payment confirmed',
      icon: CheckCircleIcon,
      status: 'completed',
      color: 'green',
    },
    {
      id: 3,
      title: 'Document Verification',
      description: 'Staff is reviewing your submitted documents',
      icon: DocumentMagnifyingGlassIcon,
      status: 'in-progress', // This will be dynamic from backend
      color: 'blue',
    },
    {
      id: 4,
      title: 'Academic Review',
      description: 'Academic qualifications are being verified',
      icon: AcademicCapIcon,
      status: 'pending',
      color: 'gray',
    },
    {
      id: 5,
      title: 'Final Approval',
      description: 'Final verification by admission committee',
      icon: ShieldCheckIcon,
      status: 'pending',
      color: 'gray',
    },
  ];

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
                              College staff is currently reviewing your documents...
                            </p>
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            Estimated completion: 2-3 business days
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
                <span>You will receive email notifications at each stage of verification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>Document verification typically takes 2-3 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>Contact support if verification takes longer than expected</span>
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
