import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  User,
  CreditCard,
  Printer,
  IdCard,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';

export const StudentList = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [lscCenters, setLscCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLSC, setFilterLSC] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<any>(null);

  useEffect(() => {
    fetchStudents();
    fetchLSCCenters();
  }, []);

  const fetchLSCCenters = () => {
    axios.get('http://localhost:8000/api/lsc-centers/')
      .then(res => {
        if (res.data?.data) {
          setLscCenters(res.data.data);
        }
      })
      .catch(err => {
        console.error('Error fetching LSC centers:', err);
      });
  };

  const fetchStudents = () => {
    setLoading(true);
    axios.get('http://localhost:8000/api/lsc-admin/student-admissions/')
      .then(res => {
        console.log('API Response:', res.data);
        if (res.data?.data) {
          setStudents(res.data.data);
          toast.success(`Loaded ${res.data.data.length} student records`);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        toast.error('Failed to load student data');
        setLoading(false);
      });
  };

  // Filter and Search - Auto Apply
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.application_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.programme?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // LSC filter
    if (filterLSC) {
      filtered = filtered.filter(s => s.lsc_code === filterLSC);
    }

    // Batch filter
    if (filterBatch) {
      filtered = filtered.filter(s => s.application_no?.includes(`/A${filterBatch}/`));
    }

    // Programme filter
    if (filterProgramme) {
      filtered = filtered.filter(s => s.programme?.toLowerCase().includes(filterProgramme.toLowerCase()));
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => {
        if (filterStatus === 'paid') return s.payment_status === 'Paid';
        if (filterStatus === 'unpaid') return s.payment_status === 'Unpaid';
        if (filterStatus === 'verified') return s.eligibility_verified === true;
        if (filterStatus === 'unverified') return s.eligibility_verified === false;
        return true;
      });
    }

    return filtered;
  }, [students, searchTerm, filterStatus, filterLSC, filterBatch, filterProgramme]);

  // Sorting
  const sortedStudents = useMemo(() => {
    let sorted = [...filteredStudents];
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof any];
        const bVal = b[sortConfig.key as keyof any];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredStudents, sortConfig]);

  // Pagination
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = ['S.No', 'Application No', 'Name', 'Email', 'Programme', 'Community', 'Payment Status', 'Applied Date'];
    const rows = filteredStudents.map(s => [
      s.sno,
      s.application_no,
      s.name,
      s.email,
      s.programme,
      s.community,
      s.payment_status,
      s.applied_date
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading Student Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Admissions Portal</h1>
        <p className="text-gray-600">Learning Supportive Center Management System</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Smart Filters</h2>
          <p className="text-sm text-gray-500">Filters apply automatically as you select</p>
          {(filterLSC || filterBatch || filterProgramme || filterStatus !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setFilterLSC('');
                setFilterBatch('');
                setFilterProgramme('');
                setFilterStatus('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all font-medium text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* LSC Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Learning Supportive Center</label>
            <select
              value={filterLSC}
              onChange={(e) => setFilterLSC(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 font-medium cursor-pointer"
            >
              <option value="">🏫 All LSC Centers</option>
              {lscCenters.map((lsc) => (
                <option key={lsc.lsc_code} value={lsc.lsc_code}>
                  📍 {lsc.lsc_code} - {lsc.lsc_name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Admission Batch</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 transition-all text-gray-700 font-medium cursor-pointer"
            >
              <option value="">📅 All Batches</option>
              <option value="24">🎓 A24 (2024)</option>
              <option value="25">🎓 A25 (2025)</option>
              <option value="23">🎓 A23 (2023)</option>
            </select>
          </div>

          {/* Programme Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Programme</label>
            <select
              value={filterProgramme}
              onChange={(e) => setFilterProgramme(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 transition-all text-gray-700 font-medium cursor-pointer"
            >
              <option value="">📚 All Programmes</option>
              <option value="postgraduate">🎓 Postgraduate</option>
              <option value="undergraduate">🎓 Undergraduate</option>
              <option value="diploma">🎓 Diploma</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 transition-all text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">⭐ All Status</option>
              <option value="paid">💰 Payment Completed</option>
              <option value="unpaid">⏳ Payment Pending</option>
              <option value="verified">✅ Eligibility Verified</option>
              <option value="unverified">🔍 Verification Pending</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filterLSC || filterBatch || filterProgramme || filterStatus !== 'all') && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium">Active Filters:</span>
            {filterLSC && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1">
                LSC: {filterLSC}
                <button onClick={() => setFilterLSC('')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterBatch && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                Batch: {filterBatch}
                <button onClick={() => setFilterBatch('')} className="hover:bg-green-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterProgramme && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center gap-1">
                Programme: {filterProgramme}
                <button onClick={() => setFilterProgramme('')} className="hover:bg-purple-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs flex items-center gap-1">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:bg-orange-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border-2 border-indigo-300 rounded-lg text-sm bg-gradient-to-r from-indigo-50 to-blue-50 font-semibold text-indigo-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm font-medium">entries</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Search:</span>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-1.5 border-2 border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all w-72 font-medium"
                placeholder="Search by application no, name, email..."
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-red-100 rounded-full transition-all"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">💰 Payment Completed</p>
              <p className="text-2xl font-bold text-emerald-800">
                {students.filter(s => s.payment_status === 'Paid').length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">⏳ Payment Pending</p>
              <p className="text-2xl font-bold text-orange-800">
                {students.filter(s => s.payment_status === 'Unpaid').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">✅ Eligibility Verified</p>
              <p className="text-2xl font-bold text-blue-800">
                {students.filter(s => s.eligibility_verified).length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">🔍 Verification Pending</p>
              <p className="text-2xl font-bold text-purple-800">
                {students.filter(s => !s.eligibility_verified).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SNo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Community</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <User className="w-12 h-12 text-gray-400 mb-2" />
                      <p>No students found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => (
                  <tr key={student.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.application_no}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.programme}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.community}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {student.payment_status === 'Paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {student.eligibility_verified ? (
                        <div className="text-center">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </div>
                          {student.enrollment_no && (
                            <div className="text-xs text-gray-600">📝 {student.enrollment_no}</div>
                          )}
                          {student.admission_confirmed && (
                            <div className="text-xs text-green-600">🎓 Confirmed</div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/lsc/dashboard/admin/admissions/${student.application_no || student.id || 'unknown'}`}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/lsc/dashboard/admin/admissions/verify/${student.application_no || student.id || 'unknown'}`}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Verify Application"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => window.open(`/print/${student.application_no || student.id || 'unknown'}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Print Application"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sortedStudents.length > 0 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md mt-4">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedStudents.length)} of {sortedStudents.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Previous
            </button>

            {/* Page numbers */}
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded text-sm font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-4 text-right">
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>
    </div>
  );
};



