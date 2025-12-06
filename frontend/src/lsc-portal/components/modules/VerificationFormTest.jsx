import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const VerificationFormTest = () => {
  const params = useParams();
  const navigate = useNavigate();
  const applicationId = params.applicationId;

  console.log('=== VERIFICATION FORM TEST RENDERED ===');
  console.log('URL:', window.location.href);
  console.log('Params:', params);
  console.log('Application ID:', applicationId);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Success Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          ✅ VERIFICATION FORM PAGE IS WORKING!
        </h1>
        <p className="text-green-600">
          Route successfully matched and component loaded
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/lsc/dashboard/admin/admissions')}
        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        ← Back to List
      </button>

      {/* Application Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">
          Application Information
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">Application ID:</span>
            <span className="font-mono">{applicationId || 'NOT FOUND'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Current URL:</span>
            <span className="font-mono text-sm">{window.location.pathname}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Route Status:</span>
            <span className={applicationId ? 'text-green-600' : 'text-red-600'}>
              {applicationId ? '✓ Parameter Captured Successfully' : '✗ Parameter Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Mock Application Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">
          Application Verification Form
        </h2>

        {/* Personal Details Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-gray-800">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Programme:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter programme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter community"
              />
            </div>
          </div>
        </div>

        {/* Document Verification Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-gray-800">
            Document Verification
          </h3>
          <div className="space-y-3">
            {['SSLC Marksheet', 'HSC Marksheet', 'UG Certificate', 'Community Certificate', 'Aadhaar Card', 'Transfer Certificate'].map(doc => (
              <div key={doc} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{doc}</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    View
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Valid
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                    Invalid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility Status Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-gray-800">
            Eligibility Status
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select Status</option>
                <option>Eligible</option>
                <option>Not Eligible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks:</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Enter remarks"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Eligibility Status
          </button>
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Confirm Admission
          </button>
          <button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Print Application
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">
          🔧 Debug Information
        </h3>
        <div className="space-y-2 text-sm">
          <div><strong>Component:</strong> VerificationFormTest</div>
          <div><strong>Route Pattern:</strong> /verification/:applicationId</div>
          <div><strong>Full Route:</strong> /lsc/dashboard/admin/verification/:applicationId</div>
          <div><strong>Status:</strong> <span className="text-green-600 font-semibold">✓ WORKING</span></div>
        </div>
      </div>
    </div>
  );
};



