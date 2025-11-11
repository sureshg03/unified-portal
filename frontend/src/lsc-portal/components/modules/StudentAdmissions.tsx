import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  CreditCard,
  IdCard,
  FileText,
  Calendar,
  User,
  GraduationCap,
  Phone,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckSquare,
  XSquare,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StudentAdmissions = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLSC, setSelectedLSC] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [showEntriesCount, setShowEntriesCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState({
    application_id: '',
    eligibility_status: 'ELIGIBLE',
    verification_remarks: '',
    verified_by: 'LSC Admin'
  });

  // Fetch students data
  useEffect(() => {
    fetchStudents();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [students, searchTerm, selectedLSC, selectedBatch, selectedProgramme, selectedPaymentStatus]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/lsc-admin/student-admissions/');
      
      if (response.data.status === 'success') {
        setStudents(response.data.data);
        setFilteredStudents(response.data.data);
        toast.success(`Loaded ${response.data.count} student records`);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch student admissions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.application_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // LSC filter
    if (selectedLSC) {
      filtered = filtered.filter(student => student.lsc_code === selectedLSC);
    }

    // Batch filter
    if (selectedBatch) {
      filtered = filtered.filter(student => 
        student.application_no.includes(`/A${selectedBatch}/`)
      );
    }

    // Programme filter
    if (selectedProgramme) {
      filtered = filtered.filter(student => student.programme === selectedProgramme);
    }

    // Payment status filter
    if (selectedPaymentStatus) {
      filtered = filtered.filter(student => 
        student.payment_status.toLowerCase() === selectedPaymentStatus.toLowerCase()
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const handleViewDetails = async (student) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/lsc-admin/student-details/${student.application_no}/`
      );
      
      if (response.data.status === 'success') {
        setSelectedStudent(response.data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to fetch student details');
    }
  };

  const handleVerifyEligibility = (student) => {
    setVerificationData({
      application_id: student.application_no,
      eligibility_status: 'ELIGIBLE',
      verification_remarks: '',
      verified_by: 'LSC Admin'
    });
    setShowVerificationModal(true);
  };

  const submitVerification = async () => {
    try {
      const response = await axios.post(
        'http://localhost:8000/api/lsc-admin/verify-eligibility/',
        verificationData
      );
      
      if (response.data.status === 'success') {
        toast.success('Eligibility verification completed successfully!');
        setShowVerificationModal(false);
        fetchStudents(); // Refresh data
        
        // If eligible, show option to send semester fee notification
        if (verificationData.eligibility_status === 'ELIGIBLE') {
          toast.info('Send semester fee notification to student?', {
            onClick: () => sendSemesterFeeNotification(verificationData.application_id)
          });
        }
      }
    } catch (error) {
      console.error('Error verifying eligibility:', error);
      toast.error('Failed to verify eligibility');
    }
  };

  const sendSemesterFeeNotification = async (applicationId) => {
    try {
      const response = await axios.post(
        'http://localhost:8000/api/lsc-admin/send-semester-fee-notification/',
        {
          application_id: applicationId,
          fee_amount: 5000,
          due_date: '2026-04-30'
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Semester fee notification sent successfully!');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send semester fee notification');
    }
  };

  const generateEnrollmentID = async (student) => {
    try {
      const response = await axios.post(
        'http://localhost:8000/api/lsc-admin/generate-enrollment/',
        {
          application_id: student.application_no,
          generated_by: 'LSC Admin'
        }
      );
      
      if (response.data.status === 'success') {
        toast.success(`Enrollment ID generated: ${response.data.data.enrollment_no}`);
        fetchStudents(); // Refresh data
      }
    } catch (error) {
      console.error('Error generating enrollment ID:', error);
      toast.error('Failed to generate enrollment ID');
    }
  };

  // Pagination
  const indexOfLastEntry = currentPage * showEntriesCount;
  const indexOfFirstEntry = indexOfLastEntry - showEntriesCount;
  const currentEntries = filteredStudents.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredStudents.length / showEntriesCount);

  // Get unique values for filters
  const uniqueLSCs = [...new Set(students.map(s => s.lsc_code).filter(Boolean))];
  const uniqueProgrammes = [...new Set(students.map(s => s.programme).filter(Boolean))];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
              Student Admissions Management
            </h1>
            <p className="text-gray-600 mt-1">Verify documents, manage eligibility, and process enrollments</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchStudents}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <StatsCard
            title="Total Applications"
            value={students.length}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="Paid"
            value={students.filter(s => s.payment_status === 'Paid').length}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Pending Payment"
            value={students.filter(s => s.payment_status === 'Unpaid').length}
            icon={AlertCircle}
            color="orange"
          />
          <StatsCard
            title="Verified"
            value={students.filter(s => s.eligibility_verified).length}
            icon={CheckSquare}
            color="purple"
          />
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-md p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or application no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* LSC Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LSC Center</label>
            <select
              value={selectedLSC}
              onChange={(e) => setSelectedLSC(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- Select LSC --</option>
              {uniqueLSCs.map(lsc => (
                <option key={lsc} value={lsc}>{lsc}</option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- Select Batch --</option>
              <option value="25">2025</option>
              <option value="24">2024</option>
              <option value="23">2023</option>
            </select>
          </div>

          {/* Programme Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Programme</option>
              {uniqueProgrammes.map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        {/* Table Controls */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={showEntriesCount}
              onChange={(e) => setShowEntriesCount(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>

          <div className="text-sm text-gray-600">
            Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredStudents.length)} of {filteredStudents.length} entries
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Application No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Programme</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Community</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Print</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pay</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    <p className="mt-2 text-gray-600">Loading student data...</p>
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                currentEntries.map((student, index) => (
                  <StudentRow
                    key={student.application_no}
                    student={student}
                    index={indexOfFirstEntry + index + 1}
                    onViewDetails={handleViewDetails}
                    onVerifyEligibility={handleVerifyEligibility}
                    onGenerateEnrollment={generateEnrollmentID}
                    onSendFeeNotification={sendSemesterFeeNotification}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded-lg ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailsModal && selectedStudent && (
          <StudentDetailsModal
            student={selectedStudent}
            onClose={() => setShowDetailsModal(false)}
          />
        )}

        {showVerificationModal && (
          <VerificationModal
            data={verificationData}
            setData={setVerificationData}
            onSubmit={submitVerification}
            onClose={() => setShowVerificationModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-lg shadow-md p-4 border-l-4 border-transparent hover:border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 bg-gradient-to-br ${colors[color]} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Student Row Component
const StudentRow = ({ student, index, onViewDetails, onVerifyEligibility, onGenerateEnrollment, onSendFeeNotification }) => {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-gray-50 transition-colors"
    >
      <td className="px-4 py-3 text-sm text-gray-900">{index}</td>
      <td className="px-4 py-3 text-sm font-medium text-indigo-600">{student.application_no}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{student.programme}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{student.community}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          student.payment_status === 'Paid'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {student.payment_status}
        </span>
      </td>
      <td className="px-4 py-3">
        {student.eligibility_verified ? (
          <span className="text-sm font-semibold text-green-600">Eligibility Verified</span>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewDetails(student)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            View Application
          </motion.button>
        )}
      </td>
      <td className="px-4 py-3">
        {student.payment_status === 'Paid' && !student.eligibility_verified ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onVerifyEligibility(student)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <CheckSquare className="w-4 h-4" />
            Verify
          </motion.button>
        ) : student.eligibility_verified && !student.enrollment_no ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSendFeeNotification(student.application_no)}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
          >
            <Mail className="w-4 h-4" />
            Send Fee
          </motion.button>
        ) : null}
      </td>
      <td className="px-4 py-3">
        {student.enrollment_no ? (
          <span className="text-sm font-semibold text-indigo-600">{student.enrollment_no}</span>
        ) : student.eligibility_verified ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onGenerateEnrollment(student)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            <IdCard className="w-4 h-4" />
            Generate ID
          </motion.button>
        ) : null}
      </td>
    </motion.tr>
  );
};

// Student Details Modal Component
const StudentDetailsModal = ({ student, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Application Details</h2>
              <p className="text-indigo-100 mt-1">{student.application_no}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <Section title="Personal Information" icon={User}>
            <InfoGrid>
              <InfoItem label="Name" value={student.name} />
              <InfoItem label="Date of Birth" value={student.dob} />
              <InfoItem label="Gender" value={student.gender} />
              <InfoItem label="Email" value={student.email} />
              <InfoItem label="Phone" value={student.phone} />
              <InfoItem label="Aadhaar No" value={student.aadhaar_no} />
              <InfoItem label="Community" value={student.community} />
              <InfoItem label="Religion" value={student.religion} />
            </InfoGrid>
          </Section>

          {/* Programme Information */}
          <Section title="Programme Information" icon={GraduationCap}>
            <InfoGrid>
              <InfoItem label="Programme" value={student.programme_applied} />
              <InfoItem label="Course" value={student.course} />
              <InfoItem label="Medium" value={student.medium} />
              <InfoItem label="Academic Year" value={student.academic_year} />
            </InfoGrid>
          </Section>

          {/* Payment Information */}
          <Section title="Payment Information" icon={CreditCard}>
            <InfoGrid>
              <InfoItem label="Status" value={student.payment_status} />
              <InfoItem label="Amount" value={`₹${student.payment_details?.amount || 0}`} />
              <InfoItem label="Transaction ID" value={student.payment_details?.transaction_id} />
              <InfoItem label="Transaction Date" value={student.payment_details?.transaction_date} />
            </InfoGrid>
          </Section>

          {/* Documents */}
          <Section title="Uploaded Documents" icon={FileText}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(student.documents || {}).map(([key, url]) => (
                url && key !== 'semester_marksheets' && (
                  <DocumentCard key={key} title={key.replace(/_/g, ' ').toUpperCase()} url={url} />
                )
              ))}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Print Application
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Verification Modal Component
const VerificationModal = ({ data, setData, onSubmit, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
          <h2 className="text-xl font-bold">Verify Eligibility</h2>
          <p className="text-green-100 mt-1">{data.application_id}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eligibility Status
            </label>
            <select
              value={data.eligibility_status}
              onChange={(e) => setData({...data, eligibility_status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ELIGIBLE">✓ Eligible</option>
              <option value="NOT_ELIGIBLE">✗ Not Eligible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Remarks (Optional)
            </label>
            <textarea
              value={data.verification_remarks}
              onChange={(e) => setData({...data, verification_remarks: e.target.value})}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter any remarks or notes..."
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Verification
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper Components
const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-indigo-600" />
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoGrid = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {children}
  </div>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-1">{value || 'N/A'}</p>
  </div>
);

const DocumentCard = ({ title, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
  >
    <FileText className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
    <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">{title}</p>
  </a>
);

export default StudentAdmissions;
