import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  X,
  BookOpen,
  Monitor,
  Headphones,
  Building,
  MessageCircle
} from 'lucide-react';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    category: 'GENERAL',
    rating: 0,
    title: '',
    message: ''
  });
  
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const categories = [
    { value: 'COURSE_CONTENT', label: 'Course Content', icon: BookOpen },
    { value: 'PORTAL_EXPERIENCE', label: 'Portal Experience', icon: Monitor },
    { value: 'SUPPORT', label: 'Support Services', icon: Headphones },
    { value: 'LSC_EXPERIENCE', label: 'LSC Center Experience', icon: Building },
    { value: 'GENERAL', label: 'General Feedback', icon: MessageCircle }
  ];

  const statusColors = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'REVIEWED': 'bg-blue-100 text-blue-800',
    'FLAGGED': 'bg-red-100 text-red-800',
    'RESOLVED': 'bg-green-100 text-green-800'
  };

  useEffect(() => {
    fetchMyFeedbacks();
  }, []);

  const fetchMyFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/feedback/my-feedbacks/', {
        headers: { Authorization: `Token ${token}` }
      });
      if (response.data.status === 'success') {
        setMyFeedbacks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (formData.message.length < 10) {
      setError('Please provide at least 10 characters in your feedback message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/feedback/submit/',
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        setSubmitSuccess(true);
        setFormData({
          category: 'GENERAL',
          rating: 0,
          title: '',
          message: ''
        });
        fetchMyFeedbacks();
        
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (interactive = false) => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onClick={() => interactive && setFormData({ ...formData, rating: star })}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`focus:outline-none transition-all ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
          >
            <Star
              size={interactive ? 40 : 24}
              className={`${
                star <= (hoveredRating || formData.rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Feedback</h1>
          <p className="text-gray-600">Help us improve our educational services</p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
            >
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="text-green-800 font-semibold">Thank you for your feedback!</p>
                <p className="text-green-600 text-sm">We appreciate your input and will review it shortly.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="text-red-600" size={24} />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Feedback Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-8">
              <label className="block text-center text-lg font-semibold text-gray-700 mb-4">
                How would you rate your experience? *
              </label>
              {renderStars(true)}
              {formData.rating > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-2 text-gray-600"
                >
                  {formData.rating === 1 && 'Poor'}
                  {formData.rating === 2 && 'Fair'}
                  {formData.rating === 3 && 'Good'}
                  {formData.rating === 4 && 'Very Good'}
                  {formData.rating === 5 && 'Excellent'}
                </motion.p>
              )}
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Feedback Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                      className={`p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                        formData.category === cat.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent size={20} className="flex-shrink-0" />
                      <div className="text-sm font-medium">{cat.label}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Feedback Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title for your feedback"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Detailed Feedback *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please share your detailed feedback (minimum 10 characters)"
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.message.length}/10 characters minimum
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Feedback
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Feedback History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare />
              My Feedback History
            </h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {myFeedbacks.length} {myFeedbacks.length === 1 ? 'Feedback' : 'Feedbacks'}
            </span>
          </div>

          {myFeedbacks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>No feedback submitted yet.</p>
              <p className="text-sm">Your feedback history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myFeedbacks.map((feedback) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{feedback.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={`${
                                star <= feedback.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          {(() => {
                            const cat = categories.find(c => c.value === feedback.category);
                            const IconComponent = cat?.icon;
                            return IconComponent ? (
                              <>
                                <IconComponent size={14} />
                                {cat.label}
                              </>
                            ) : cat?.label;
                          })()}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[feedback.status]}`}>
                      {feedback.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{feedback.message}</p>
                  
                  {feedback.admin_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Admin Response:</p>
                      <p className="text-sm text-blue-700">{feedback.admin_notes}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <span>Submitted: {new Date(feedback.created_at).toLocaleDateString()}</span>
                    {feedback.reviewed_by && (
                      <span>Reviewed by: {feedback.reviewed_by}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackPage;
