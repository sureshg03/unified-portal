import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MessageSquare, Flag, CheckCircle, Clock, AlertCircle,
  Filter, Search, X, Edit, Trash2, Eye, Calendar, User, Mail,
  TrendingUp, BarChart3, Award
} from 'lucide-react';

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    flagged: 0,
    average_rating: 0
  });
  
  const [filters, setFilters] = useState({
    status: 'ALL',
    rating: 'ALL',
    category: 'ALL',
    flagged: false,
    searchQuery: ''
  });
  
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const categories = [
    { value: 'COURSE_CONTENT', label: 'Course Content', icon: '' },
    { value: 'PORTAL_EXPERIENCE', label: 'Portal Experience', icon: '' },
    { value: 'SUPPORT', label: 'Support Services', icon: '' },
    { value: 'LSC_EXPERIENCE', label: 'LSC Center Experience', icon: '' },
    { value: 'GENERAL', label: 'General Feedback', icon: '' }
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'REVIEWED', label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
    { value: 'FLAGGED', label: 'Flagged', color: 'bg-red-100 text-red-800' },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' }
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, filters]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('lscToken');
      console.log('Fetching feedbacks with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get('http://localhost:8000/api/lsc-admin/feedbacks/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Feedbacks response:', response.data);

      if (response.data.status === 'success') {
        console.log('Feedbacks data:', response.data.data);
        console.log('Feedbacks count:', response.data.data.length);
        setFeedbacks(response.data.data);
        setStats(response.data.stats);
      } else {
        console.error('Response status not success:', response.data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbacks];

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(f => f.status === filters.status);
    }

    // Rating filter
    if (filters.rating !== 'ALL') {
      filtered = filtered.filter(f => f.rating === parseInt(filters.rating));
    }

    // Category filter
    if (filters.category !== 'ALL') {
      filtered = filtered.filter(f => f.category === filters.category);
    }

    // Flagged filter
    if (filters.flagged) {
      filtered = filtered.filter(f => f.is_flagged);
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(query) ||
        f.message.toLowerCase().includes(query) ||
        f.student_name.toLowerCase().includes(query) ||
        f.student_email.toLowerCase().includes(query)
      );
    }

    setFilteredFeedbacks(filtered);
  };

  const updateFeedbackStatus = async (feedbackId, updates) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('lscToken');
      const response = await axios.patch(
        `http://localhost:8000/api/lsc-admin/feedbacks/${feedbackId}/update/`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        fetchFeedbacks();
        setShowDetailModal(false);
        setAdminNotes('');
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
      alert('Failed to update feedback');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleFlag = async (feedback) => {
    await updateFeedbackStatus(feedback.id, {
      is_flagged: !feedback.is_flagged
    });
  };

  const openDetailModal = (feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || '');
    setShowDetailModal(true);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Feedback Management</h1>
        <p className="text-gray-600">Review and manage student feedback</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Feedbacks</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <MessageSquare className="text-blue-500" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reviewed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            </div>
            <CheckCircle className="text-blue-500" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
            </div>
            <Flag className="text-red-500" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-green-600">{stats.average_rating?.toFixed(1) || 0}</p>
            </div>
            <Award className="text-green-500" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search feedback..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Flagged Toggle */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.flagged}
              onChange={(e) => setFilters({ ...filters, flagged: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show only flagged feedbacks</span>
          </label>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Feedbacks ({filteredFeedbacks.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No feedbacks found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFeedbacks.map((feedback) => (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{feedback.title}</h3>
                      {feedback.is_flagged && (
                        <Flag size={16} className="text-red-500 fill-red-500" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        statusOptions.find(s => s.value === feedback.status)?.color
                      }`}>
                        {feedback.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {feedback.student_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        {feedback.student_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(feedback.rating)}
                      <span className="text-sm text-gray-600">
                        {categories.find(c => c.value === feedback.category)?.label}
                      </span>
                    </div>

                    <p className="text-gray-600 line-clamp-2">{feedback.message}</p>

                    {feedback.admin_notes && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm font-semibold text-blue-800 mb-1">Admin Notes:</p>
                        <p className="text-sm text-blue-700">{feedback.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleFlag(feedback)}
                      className={`p-2 rounded-lg transition-colors ${
                        feedback.is_flagged
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={feedback.is_flagged ? 'Unflag' : 'Flag'}
                    >
                      <Flag size={18} className={feedback.is_flagged ? 'fill-current' : ''} />
                    </button>
                    <button
                      onClick={() => openDetailModal(feedback)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Feedback Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Student Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedFeedback.student_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedFeedback.student_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">LSC Code:</span>
                      <span className="ml-2 font-medium">{selectedFeedback.lsc_code}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedFeedback.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feedback Details */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Feedback</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Title:</span>
                      <p className="font-medium">{selectedFeedback.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <p className="font-medium">
                        {categories.find(c => c.value === selectedFeedback.category)?.label}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Rating:</span>
                      <div className="mt-1">{renderStars(selectedFeedback.rating)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Message:</span>
                      <p className="mt-1 text-gray-800 whitespace-pre-wrap">
                        {selectedFeedback.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Management */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Status Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Status</label>
                      <div className="flex gap-2">
                        {statusOptions.map((status) => (
                          <button
                            key={status.value}
                            onClick={() => updateFeedbackStatus(selectedFeedback.id, {
                              status: status.value
                            })}
                            disabled={updatingStatus}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedFeedback.status === status.value
                                ? status.color
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } disabled:opacity-50`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes for internal reference or student response..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, {
                        admin_notes: adminNotes
                      })}
                      disabled={updatingStatus}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updatingStatus ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Save Notes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {selectedFeedback.reviewed_by && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Last reviewed by <span className="font-medium">{selectedFeedback.reviewed_by}</span> on{' '}
                      <span className="font-medium">
                        {new Date(selectedFeedback.reviewed_at).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackManagement;
