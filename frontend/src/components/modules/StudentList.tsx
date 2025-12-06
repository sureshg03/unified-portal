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

    // Remove duplicates based on application_no
    const uniqueMap = new Map();
    filtered.forEach(student => {
      if (student.application_no && !uniqueMap.has(student.application_no)) {
        uniqueMap.set(student.application_no, student);
      } else if (!student.application_no && student.id && !uniqueMap.has(student.id)) {
        uniqueMap.set(student.id, student);
      }
    });
    filtered = Array.from(uniqueMap.values());

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Admissions Management</h1>
        <p className="text-gray-600 mt-1">View and manage student applications</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* LSC Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Learning Supportive Center *</label>
            <select
              value={filterLSC}
              onChange={(e) => setFilterLSC(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 font-medium cursor-pointer shadow-sm"
            >
              <option value="">-- Select LSC --</option>
              {lscCenters.map((lsc) => (
                <option key={lsc.lsc_code} value={lsc.lsc_code}>
                  {lsc.lsc_code} - {lsc.lsc_name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admission Batch *</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 font-medium cursor-pointer shadow-sm"
            >
              <option value="">-- Select Batch --</option>
              <option value="23">A23 (2023)</option>
              <option value="24">A24 (2024)</option>
              <option value="25">A25 (2025)</option>
              <option value="26">A26 (2026)</option>
            </select>
          </div>

          {/* Programme Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Programme Applied *</label>
            <select
              value={filterProgramme}
              onChange={(e) => setFilterProgramme(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 font-medium cursor-pointer shadow-sm"
            >
              <option value="">Select Programme</option>
              <option value="M.C.A">M.C.A (Master of Computer Applications)</option>
              <option value="M.B.A">M.B.A (Master of Business Administration)</option>
              <option value="M.SC">M.SC (Master of Science)</option>
              <option value="M.COM">M.COM (Master of Commerce)</option>
              <option value="MA">MA (Master of Arts)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                // Trigger search/filter
                fetchStudents();
              }}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t pt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-700 cursor-pointer shadow-sm focus:ring-2 focus:ring-green-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm font-semibold text-gray-700">entries</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Search:</span>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all w-80 font-medium shadow-sm"
                placeholder="Search by application no, name, email..."
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">SNo</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">Application No</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">Programme</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">Community</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">Print</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-r border-gray-200">Pay</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ID Card</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <User className="w-16 h-16 text-gray-400 mb-3" />
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  // Check if student is verified: eligibility_verified field OR has eligibility_status set
                  const isVerified = student.eligibility_verified || (student.eligibility_status && student.eligibility_status !== '');
                  const isPaid = student.payment_status === 'Paid';
                  const hasEnrollment = !!student.enrollment_no;
                  
                  return (
                    <tr key={student.id || idx} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium border-r border-gray-100">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-100 whitespace-nowrap">
                        {student.application_no}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium border-r border-gray-100 whitespace-nowrap">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100 whitespace-nowrap">
                        {student.programme}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100 whitespace-nowrap">
                        {student.community}
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                          isPaid 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                        {isVerified ? (
                          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded font-bold text-sm border border-green-300">
                            Eligibility Verified
                          </div>
                        ) : (
                          <Link
                            to={`/lsc/dashboard/admin/admissions/verify/${student.application_no || student.id || 'unknown'}`}
                            className="inline-block px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors"
                          >
                            View Application
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        {isVerified && isPaid ? (
                          <button
                            onClick={() => {
                              // Navigate to second year payment
                              window.location.href = `/payment/second-year/${student.application_no}`;
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors"
                          >
                            Second Year Fee
                          </button>
                        ) : isVerified && !isPaid ? (
                          <button
                            onClick={() => {
                              // Navigate to first year payment
                              window.location.href = `/payment/first-year/${student.application_no}`;
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors"
                          >
                            Pay
                          </button>
                        ) : (
                          <div className="text-gray-400 text-sm font-medium">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isVerified ? (
                          <Link
                            to={`/lsc/dashboard/admin/id-card/${student.application_no}`}
                            className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <IdCard className="w-4 h-4" />
                            ID Card
                          </Link>
                        ) : (
                          <div className="text-gray-400 text-sm font-medium">-</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sortedStudents.length > 0 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow-md mt-4 border border-gray-200">
          <div className="text-sm text-gray-700 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedStudents.length)} of {sortedStudents.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-all ${
                    currentPage === pageNum
                      ? 'bg-green-600 text-white border-green-600'
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
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



