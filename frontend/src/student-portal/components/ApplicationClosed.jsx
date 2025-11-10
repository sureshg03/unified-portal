import React, { useEffect, useState } from 'react';
import { XCircleIcon, CalendarIcon, ClockIcon, BuildingOfficeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const ApplicationClosed = () => {
  const [lscInfo, setLscInfo] = useState({ code: '', name: '' });
  const [applicationInfo, setApplicationInfo] = useState(null);

  useEffect(() => {
    // Get LSC info from URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const lscCode = urlParams.get('ref') || sessionStorage.getItem('referral_lsc_code') || '';
    const lscName = urlParams.get('center') || sessionStorage.getItem('referral_lsc_name') || '';
    
    setLscInfo({ code: lscCode, name: lscName });

    // Fetch application settings to show dates
    fetchApplicationInfo();
  }, []);

  // Auto-check every 5 seconds if applications are reopened
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkApplicationStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Check on window focus
  useEffect(() => {
    const handleFocus = () => {
      checkApplicationStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Check on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkApplicationStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchApplicationInfo = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/application-settings/');
      const data = await response.json();
      if (data && data.length > 0) {
        setApplicationInfo(data[0]);
      }
    } catch (error) {
      console.error('Error fetching application info:', error);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/application-settings/');
      const data = await response.json();
      if (data && data.length > 0) {
        const activeSetting = data.find(s => s.is_active && (s.is_open || s.status === 'OPEN')) || data[0];
        const isOpen = activeSetting.is_open || activeSetting.status === 'OPEN';
        
        if (isOpen) {
          // Applications reopened! Redirect to signup
          const urlParams = new URLSearchParams(window.location.search);
          window.location.href = '/student/signup' + (urlParams.toString() ? '?' + urlParams.toString() : '');
        }
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative max-w-5xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-red-600 py-6 px-8 text-center">
            <div className="inline-flex p-4 bg-white rounded-full mb-3">
              <XCircleIcon className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-1">
              Applications Closed
            </h1>
            
            <p className="text-white/95">
              The admission application period has ended
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* LSC Info if available */}
            {lscInfo.code && (
              <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-600 rounded-lg">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Learning Support Center
                    </h3>
                    <p className="text-indigo-600 font-semibold text-lg">
                      {lscInfo.name}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Center Code: <span className="font-mono font-semibold">{lscInfo.code}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Message */}
            <div className="bg-red-50 rounded-lg p-5 border border-red-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <XCircleIcon className="w-6 h-6 text-red-500" />
                Application Period Has Ended
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We're sorry, but the admission application period for this academic year has officially closed. 
                We are no longer accepting new applications at this time.
              </p>
            </div>

            {/* Application Timeline */}
            {applicationInfo && (
              <div className="bg-gray-100 rounded-lg p-5 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Application Timeline
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-200">
                    <div className="p-2 bg-green-100 rounded-md">
                      <CalendarIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Opening Date</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatDate(applicationInfo.opening_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-200">
                    <div className="p-2 bg-red-100 rounded-md">
                      <ClockIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Closing Date</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatDate(applicationInfo.closing_date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium">
                    📅 Academic Year: <span className="font-bold">{applicationInfo.admission_year}</span>
                  </p>
                  <p className="text-sm text-blue-900 font-medium mt-1">
                    📝 Application Code: <span className="font-mono font-bold">{applicationInfo.admission_code}</span>
                  </p>
                </div>
              </div>
            )}

            {/* What's Next Section */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                What's Next?
              </h3>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Stay Updated:</strong> Check our official website regularly for announcements about the next admission cycle.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Contact LSC:</strong> Reach out to your local Learning Support Center for information about future application periods.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Prepare Documents:</strong> Use this time to gather all necessary documents for the next application period.
                  </p>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="bg-purple-50 rounded-lg p-5 text-center border border-purple-200">
              <EnvelopeIcon className="w-10 h-10 text-purple-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Need Assistance?
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                If you have any questions or need more information, please contact your local Learning Support Center.
              </p>
              {lscInfo.name && (
                <div className="inline-block bg-white rounded-lg px-5 py-2 border border-purple-300">
                  <p className="text-sm text-gray-600 font-medium">Your LSC</p>
                  <p className="text-lg font-bold text-purple-600">{lscInfo.name}</p>
                </div>
              )}
            </div>

            {/* Footer Note */}
            <div className="text-center pt-2">
              <p className="text-gray-500 text-xs">
                Thank you for your interest in our institution. We look forward to receiving your application in the next cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationClosed;
