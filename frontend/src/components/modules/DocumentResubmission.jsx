import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaUpload, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaClock } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const DocumentResubmission = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [applicationData, setApplicationData] = useState(null);
  const [invalidDocuments, setInvalidDocuments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setVerifying(true);
      const response = await axios.get(`http://localhost:8000/api/resubmit-documents/verify/${token}/`);
      
      console.log('Verification response:', response.data);
      
      if (response.data.status === 'success') {
        setApplicationData(response.data.data);
        setInvalidDocuments(response.data.data.invalid_documents);
        setLoading(false);
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Invalid or expired resubmission link';
      toast.error(errorMsg + '. Please contact support.');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setVerifying(false);
    }
  };

  const handleFileChange = (documentType, file) => {
    // Validate file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [documentType]: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.'
      }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        [documentType]: 'File size too large. Maximum size is 5MB.'
      }));
      return;
    }

    setErrors(prev => ({ ...prev, [documentType]: null }));
    setUploadedFiles(prev => ({ ...prev, [documentType]: file }));
  };

  const uploadDocument = async (documentType) => {
    const file = uploadedFiles[documentType];
    if (!file) return;

    setUploading(prev => ({ ...prev, [documentType]: true }));

    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);

    try {
      await axios.post(`http://localhost:8000/api/resubmit-documents/submit/${token}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`${documentType} uploaded successfully!`);
      setUploadedFiles(prev => ({ ...prev, [documentType]: null }));

      // Check if all documents are uploaded
      const remainingDocs = invalidDocuments.filter(doc => !uploadedFiles[doc] || doc !== documentType);
      if (remainingDocs.length === 0) {
        setTimeout(() => navigate('/student/resubmission-success'), 2000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Failed to upload ${documentType}. Please try again.`);
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const getDocumentDisplayName = (docType) => {
    const names = {
      'sslc': 'SSLC Certificate',
      'hsc': 'HSC Certificate',
      'ug': 'UG Certificate',
      'pg': 'PG Certificate',
      'community': 'Community Certificate',
      'aadhar': 'Aadhar Card',
      'photo': 'Photo',
      'signature': 'Signature',
      'transfer': 'Transfer Certificate'
    };
    return names[docType] || docType;
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying resubmission link...</p>
        </motion.div>
      </div>
    );
  }

  if (loading || !applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md"
        >
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-4">
            This resubmission link is invalid or has expired. Please contact support for assistance.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-8"
        >
          <div className="text-center">
            <FaFileAlt className="text-blue-600 text-4xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Resubmission</h1>
            <p className="text-gray-600 mb-4">
              Application ID: <span className="font-semibold">{applicationData.application_id}</span>
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <FaClock className="text-yellow-600 mr-2" />
                <span className="font-semibold text-yellow-800">Important:</span>
              </div>
              <p className="text-yellow-700 text-sm">
                This link expires in 30 days. Please upload all required documents before the expiration date.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resubmission Instructions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📋 Requirements:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload clear, original copies only</li>
                <li>• File formats: PDF, JPG, PNG</li>
                <li>• Maximum file size: 5MB per document</li>
                <li>• Ensure documents are properly scanned</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📞 Support:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Email: cdoe@periyaruniversity.ac.in</li>
                <li>• Phone: +91-427-2345766</li>
                <li>• Office Hours: Mon-Fri, 9:00 AM - 5:00 PM</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Document Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Required Documents</h2>

          <div className="space-y-6">
            {invalidDocuments.map((docType) => (
              <div key={docType} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getDocumentDisplayName(docType)}
                  </h3>
                  {uploadedFiles[docType] && (
                    <FaCheckCircle className="text-green-500 text-xl" />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(docType, e.target.files[0])}
                      className="hidden"
                      id={`file-${docType}`}
                    />
                    <label
                      htmlFor={`file-${docType}`}
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FaUpload className="text-gray-400 text-2xl mb-2" />
                      <span className="text-gray-600">
                        {uploadedFiles[docType] ? uploadedFiles[docType].name : 'Click to select file'}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        PDF, JPG, PNG up to 5MB
                      </span>
                    </label>
                  </div>

                  {errors[docType] && (
                    <p className="text-red-600 text-sm">{errors[docType]}</p>
                  )}

                  <button
                    onClick={() => uploadDocument(docType)}
                    disabled={!uploadedFiles[docType] || uploading[docType]}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {uploading[docType] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaUpload className="mr-2" />
                        Upload {getDocumentDisplayName(docType)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {invalidDocuments.length === 0 && (
            <div className="text-center py-12">
              <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Documents Submitted</h3>
              <p className="text-gray-600">
                Your resubmitted documents will be reviewed by our team within 2-3 business days.
              </p>
            </div>
          )}
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default DocumentResubmission;