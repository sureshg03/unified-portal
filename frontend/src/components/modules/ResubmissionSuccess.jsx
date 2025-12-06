import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaEnvelope, FaPhone, FaHome } from 'react-icons/fa';

const ResubmissionSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FaCheckCircle className="text-green-600 text-4xl" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents Resubmitted Successfully!</h1>
          <p className="text-gray-600">
            Thank you for resubmitting your documents. Your application is now under review.
          </p>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What Happens Next?</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Document Review</h3>
                <p className="text-gray-600 text-sm">
                  Our LSC team will review your resubmitted documents within 2-3 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Approval Notification</h3>
                <p className="text-gray-600 text-sm">
                  You'll receive an email notification once your documents are approved or if further action is needed.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Application Processing</h3>
                <p className="text-gray-600 text-sm">
                  Once approved, your application will continue through the normal processing workflow.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-50 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <FaEnvelope className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email Support</p>
                <p className="text-gray-600 text-sm">cdoe@periyaruniversity.ac.in</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaPhone className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Phone Support</p>
                <p className="text-gray-600 text-sm">+91-427-2345766</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-3">
              <FaClock className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Office Hours</p>
                <p className="text-gray-600 text-sm">Monday - Friday, 9:00 AM - 5:00 PM</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => navigate('/student/login')}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FaHome />
            <span>Go to Student Portal</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Back to Homepage</span>
          </button>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6 pt-6 border-t border-gray-200"
        >
          <p className="text-sm text-gray-500">
            Centre for Distance and Online Education (CDOE)<br />
            Periyar University
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResubmissionSuccess;