'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Users,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  BarChart3,
  Zap,
  TrendingUp,
  Award,
  Timer,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

interface AdmissionSession {
  id: number;
  admission_code: string;
  admission_type: string;
  admission_year: string;
  admission_key: string;
  opening_date: string;
  closing_date: string;
  status: 'OPEN' | 'CLOSED' | 'SCHEDULED' | 'EXPIRED';
  description?: string;
  max_applications: number;
  current_applications: number;
  is_active: boolean;
  is_open: boolean;
  is_close: boolean;
  is_currently_open: boolean;
  days_remaining: number;
  can_accept_applications: boolean;
}

interface AdmissionSessionFormData {
  admission_code: string;
  admission_type: string;
  admission_year: string;
  admission_key: string;
  opening_date: string;
  closing_date: string;
  description: string;
  max_applications: number;
  is_open: boolean;
  is_close: boolean;
}

const ADMISSION_TYPES = [
  { value: 'ACADEMIC_YEAR', label: 'Academic Year' },
  { value: 'CALENDAR_YEAR', label: 'Calendar Year' },
];

export const AdmissionManagement = () => {
  const [sessions, setSessions] = useState<AdmissionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdmissionSession | null>(null);
  const [formData, setFormData] = useState<AdmissionSessionFormData>({
    admission_code: '',
    admission_type: '',
    admission_year: '',
    admission_key: '',
    opening_date: '',
    closing_date: '',
    description: '',
    max_applications: 0,
    is_open: false,
    is_close: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Enhanced features state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchSessions();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/application-settings/');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching admission sessions:', error);
      toast.error('Failed to load admission sessions');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.admission_code) newErrors.admission_code = 'Admission code is required';
    if (!formData.admission_type) newErrors.admission_type = 'Admission type is required';
    if (!formData.admission_year) newErrors.admission_year = 'Admission year is required';
    if (!formData.admission_key) newErrors.admission_key = 'Admission key is required';
    if (!formData.opening_date) newErrors.opening_date = 'Opening date is required';
    if (!formData.closing_date) newErrors.closing_date = 'Closing date is required';

    if (formData.opening_date && formData.closing_date &&
        new Date(formData.closing_date) < new Date(formData.opening_date)) {
      newErrors.closing_date = 'Closing date must be after opening date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSession = async () => {
    try {
      if (!validateForm()) {
        toast.error('Please fix all errors before submitting');
        return;
      }

      await api.post('/application-settings/', formData);
      toast.success('Admission session created successfully!');
      setShowCreateDialog(false);
      resetForm();
      fetchSessions();
    } catch (error: any) {
      console.error('Error creating admission session:', error);
      // Handle validation errors from backend
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.admission_code) {
          toast.error(`Admission Code: ${errors.admission_code[0]}`);
        } else if (errors.admission_key) {
          toast.error(`Admission Key: ${errors.admission_key[0]}`);
        } else {
          const errorMsg = errors.detail || errors.error || 'Failed to create admission session';
          toast.error(errorMsg);
        }
      } else {
        toast.error('Failed to create admission session');
      }
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;

    try {
      await api.put(`/application-settings/${selectedSession.id}/`, formData);
      toast.success('Admission session updated successfully');
      setShowEditDialog(false);
      setSelectedSession(null);
      resetForm();
      fetchSessions();
    } catch (error: any) {
      console.error('Error updating admission session:', error);
      toast.error(error.response?.data?.detail || 'Failed to update admission session');
    }
  };

  const handleToggleStatus = async (session: AdmissionSession) => {
    try {
      await api.post(`/application-settings/${session.id}/toggle_status/`);
      toast.success(`Admission ${session.status === 'OPEN' ? 'closed' : 'opened'} successfully`);
      fetchSessions();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    try {
      await api.delete(`/application-settings/${selectedSession.id}/`);
      toast.success('Admission session deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting admission session:', error);
      toast.error('Failed to delete admission session');
    }
  };

  const resetForm = () => {
    setFormData({
      admission_code: '',
      admission_type: '',
      admission_year: '',
      admission_key: '',
      opening_date: '',
      closing_date: '',
      description: '',
      max_applications: 0,
      is_open: false,
      is_close: true,
    });
    setErrors({});
  };

  const openEditDialog = (session: AdmissionSession) => {
    setSelectedSession(session);
    setFormData({
      admission_code: session.admission_code,
      admission_type: session.admission_type,
      admission_year: session.admission_year,
      admission_key: session.admission_key,
      opening_date: session.opening_date,
      closing_date: session.closing_date,
      description: session.description || '',
      max_applications: session.max_applications,
      is_open: session.is_open,
      is_close: session.is_close,
    });
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
      CLOSED: { color: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle },
      SCHEDULED: { color: 'bg-sky-100 text-sky-800 border-sky-200', icon: Clock },
      EXPIRED: { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CLOSED;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </Badge>
    );
  };

  // Enhanced utility functions
  const handleExportToExcel = () => {
    const exportData = filteredSessions.map(session => ({
      'Admission Code': session.admission_code,
      'Type': ADMISSION_TYPES.find(t => t.value === session.admission_type)?.label,
      'Year': session.admission_year,
      'Status': session.status,
      'Opening Date': new Date(session.opening_date).toLocaleDateString(),
      'Closing Date': new Date(session.closing_date).toLocaleDateString(),
      'Applications': `${session.current_applications}/${session.max_applications === 0 ? 'Unlimited' : session.max_applications}`,
      'Days Remaining': session.days_remaining,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admission Sessions');
    XLSX.writeFile(wb, `admission_sessions_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported to Excel successfully!');
  };

  const handleDuplicateSession = (session: AdmissionSession) => {
    setFormData({
      admission_code: `${session.admission_code}_COPY`,
      admission_type: session.admission_type,
      admission_year: session.admission_year,
      admission_key: `${session.admission_key}_COPY`,
      opening_date: session.opening_date,
      closing_date: session.closing_date,
      description: session.description || '',
      max_applications: session.max_applications,
      is_open: false,
      is_close: true,
    });
    setShowCreateDialog(true);
    toast.info('Session data copied. Update and save.');
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) {
      toast.error('No sessions selected');
      return;
    }

    try {
      await Promise.all(
        selectedSessions.map(id => api.delete(`/application-settings/${id}/`))
      );
      toast.success(`${selectedSessions.length} sessions deleted successfully`);
      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting sessions:', error);
      toast.error('Failed to delete some sessions');
    }
  };

  const toggleSelectAll = () => {
    if (selectedSessions.length === filteredSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(filteredSessions.map(s => s.id));
    }
  };

  const toggleSelectSession = (id: number) => {
    setSelectedSessions(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Filtering and pagination
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.admission_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.admission_year.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  const stats = {
    open: sessions.filter(s => s.status === 'OPEN').length,
    scheduled: sessions.filter(s => s.status === 'SCHEDULED').length,
    closed: sessions.filter(s => s.status === 'CLOSED').length,
    total: sessions.length,
    totalApplications: sessions.reduce((sum, s) => sum + s.current_applications, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <Calendar className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">Loading Admission Sessions</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Admission Management
            </h1>
            <p className="text-sm text-gray-600 mt-2 ml-13">
              Manage admission sessions and control online application periods
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportToExcel} 
              variant="outline" 
              className="h-9 px-4 rounded-lg text-sm border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-500 hover:border-emerald-400 hover:scale-105 hover:shadow-md transition-all duration-300 font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
              Export
            </Button>
            <Button 
              onClick={fetchSessions} 
              variant="outline"
              className="h-9 px-4 rounded-lg text-sm border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-500 hover:border-blue-400 hover:scale-105 hover:shadow-md transition-all duration-300 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="h-9 px-5 rounded-lg text-sm bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Admission
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards with Advanced Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Open Sessions</p>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 mb-1">{stats.open}</p>
                  <p className="text-[10px] text-gray-500">Active & Accepting</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-100">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium">Status</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-sky-50 to-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-sky-400"></div>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide">Scheduled</p>
                    <Timer className="w-3 h-3 text-sky-500" />
                  </div>
                  <p className="text-2xl font-bold text-sky-600 mb-1">{stats.scheduled}</p>
                  <p className="text-[10px] text-gray-500">Upcoming Soon</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-sky-100">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium">Status</span>
                  <span className="text-sky-600 font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Pending
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-400"></div>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Closed</p>
                    <XCircle className="w-3 h-3 text-rose-500" />
                  </div>
                  <p className="text-2xl font-bold text-rose-600 mb-1">{stats.closed}</p>
                  <p className="text-[10px] text-gray-500">Not Accepting</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-rose-100">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium">Status</span>
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <PowerOff className="w-2.5 h-2.5" /> Inactive
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">Total Sessions</p>
                    <Award className="w-3 h-3 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mb-1">{stats.total}</p>
                  <p className="text-[10px] text-gray-500">All Time</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-purple-100">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-purple-600 font-bold flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> {stats.total}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-400"></div>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Applications</p>
                    <TrendingUp className="w-3 h-3 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600 mb-1">{stats.totalApplications}</p>
                  <p className="text-[10px] text-gray-500">Total Received</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-100">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium">Count</span>
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" /> {stats.totalApplications}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filter & Actions Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by admission code or year..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11 pl-11 pr-10 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-11 pl-10 pr-10 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-sm font-medium appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="ALL">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="CLOSED">Closed</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-11 px-4 pr-10 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-sm font-medium appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                {selectedSessions.length > 0 && (
                  <Button
                    onClick={handleBulkDelete}
                    variant="outline"
                    className="h-11 px-4 rounded-lg text-sm border border-rose-300 bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 hover:from-rose-500 hover:to-red-00 hover:border-rose-400 hover:scale-105 shadow-sm hover:shadow-md transition-all duration-300 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete ({selectedSessions.length})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Admission Sessions</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredSessions.length)} of {filteredSessions.length} sessions
                </CardDescription>
              </div>
              {filteredSessions.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSessions.length === filteredSessions.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </label>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {sessions.length === 0 ? 'No Admission Sessions' : 'No Results Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {sessions.length === 0 
                      ? 'Create your first admission session to start accepting applications'
                      : 'Try adjusting your search or filter criteria'}
                  </p>
                  {sessions.length === 0 && (
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="h-11 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Admission Session
                    </Button>
                  )}
                </div>
              ) : (
                currentSessions.map((session) => (
                  <Card key={session.id} className="relative border-0 bg-gradient-to-r from-white to-purple-50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                      session.status === 'OPEN' ? 'bg-gradient-to-b from-emerald-500 to-emerald-600' :
                      session.status === 'SCHEDULED' ? 'bg-gradient-to-b from-sky-500 to-sky-600' :
                      session.status === 'CLOSED' ? 'bg-gradient-to-b from-rose-500 to-rose-600' :
                      'bg-gradient-to-b from-gray-500 to-gray-600'
                    }`}></div>
                    <CardContent className="pt-6 pl-8">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => toggleSelectSession(session.id)}
                          className="mt-1 w-5 h-5 text-purple-600 bg-gray-100 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 cursor-pointer transition-all hover:scale-110"
                        />
                        
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{session.admission_code}</h3>
                            {getStatusBadge(session.status)}
                            {!session.is_active && (
                              <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 px-2 py-0.5 text-[10px] font-bold shadow-sm">
                                ⚠️ Inactive
                              </Badge>
                            )}
                            {(session.is_open || session.is_close) && (
                              <Badge variant="outline" className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border-amber-300 px-2 py-0.5 text-[10px] font-bold shadow-sm animate-pulse">
                                🔧 Manual Override
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 mb-3">
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-100 hover:shadow-md transition-all">
                              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> Type
                              </p>
                              <p className="text-sm font-bold text-gray-900 leading-tight">
                                {ADMISSION_TYPES.find(t => t.value === session.admission_type)?.label}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100 hover:shadow-md transition-all">
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Award className="w-2.5 h-2.5" /> Year
                              </p>
                              <p className="text-sm font-bold text-gray-900 leading-tight">{session.admission_year}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-100 hover:shadow-md transition-all">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> Opens
                              </p>
                              <p className="text-sm font-bold text-gray-900 leading-tight">
                                {new Date(session.opening_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-red-50 p-3 rounded-lg border border-rose-100 hover:shadow-md transition-all">
                              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> Closes
                              </p>
                              <p className="text-sm font-bold text-gray-900 leading-tight">
                                {new Date(session.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 py-3 px-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 font-medium leading-tight">Applications</p>
                                <p className="text-sm font-bold text-gray-900 leading-tight">
                                  {session.current_applications} / {session.max_applications === 0 ? '∞' : session.max_applications}
                                </p>
                              </div>
                            </div>
                            {session.days_remaining > 0 && session.status === 'OPEN' && (
                              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm animate-pulse">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                  <Timer className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500 font-medium leading-tight">Time Left</p>
                                  <p className="text-sm font-bold text-amber-600 leading-tight">
                                    {session.days_remaining} days
                                  </p>
                                </div>
                              </div>
                            )}
                            {session.can_accept_applications && (
                              <div className="flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] font-bold text-emerald-700">Accepting</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(session.status === 'OPEN' || session.status === 'CLOSED') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(session)}
                              className={`h-9 px-3 rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 ${
                                session.status === 'OPEN' 
                                  ? 'border border-rose-300 bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 hover:from-rose-500 hover:to-red-700 hover:border-rose-400' 
                                  : 'border border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 hover:from-emerald-500 hover:to-green-700 hover:border-emerald-400'
                              }`}
                            >
                              {session.status === 'OPEN' ? (
                                <>
                                  <PowerOff className="w-3.5 h-3.5 mr-1.5" /> 
                                  <span>Close</span>
                                </>
                              ) : (
                                <>
                                  <Power className="w-3.5 h-3.5 mr-1.5" /> 
                                  <span>Open</span>
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateSession(session)}
                            className="h-9 px-3 rounded-lg text-xs border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-500 hover:border-purple-400 hover:scale-105 shadow-sm hover:shadow-md transition-all duration-300 font-semibold"
                            title="Duplicate Session"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                            <span>Copy</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(session)}
                            className="h-9 px-3 rounded-lg text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-500 hover:border-indigo-400 hover:scale-105 shadow-sm hover:shadow-md transition-all duration-300 font-semibold"
                            title="Edit Session"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSession(session);
                              setShowDeleteDialog(true);
                            }}
                            className="h-9 px-3 rounded-lg text-xs border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-500 hover:border-rose-400 hover:scale-105 shadow-sm hover:shadow-md transition-all duration-300 font-semibold"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredSessions.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">{Math.min(endIndex, filteredSessions.length)}</span> of{' '}
                  <span className="font-bold text-gray-900">{filteredSessions.length}</span> sessions
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-4 rounded-lg text-sm border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1.5" />
                    Previous
                  </Button>

                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white scale-105'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:scale-105'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-4 rounded-lg text-sm border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-white">
          <DialogHeader className="space-y-2 pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-purple-600">Create New Admission Session</DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Fill in the details to create a new admission session
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Admission Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Admission Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: A24, A25"
                  value={formData.admission_code}
                  onChange={(e) => {
                    setFormData({ ...formData, admission_code: e.target.value.toUpperCase() });
                    if (errors.admission_code) setErrors({ ...errors, admission_code: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border-2 text-sm font-medium transition-colors
                    ${errors.admission_code ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300 bg-white'}`}
                />
                {errors.admission_code && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.admission_code}
                  </p>
                )}
              </div>

              {/* Admission Type - NATIVE SELECT */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Admission Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.admission_type}
                  onChange={(e) => {
                    setFormData({ ...formData, admission_type: e.target.value });
                    if (errors.admission_type) setErrors({ ...errors, admission_type: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border-2 text-sm font-medium transition-colors appearance-none bg-white
                    ${errors.admission_type ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300'}`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="">Select admission type</option>
                  {ADMISSION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.admission_type && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.admission_type}
                  </p>
                )}
              </div>

              {/* Admission Year */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Admission Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2024-25 or 2025"
                  value={formData.admission_year}
                  onChange={(e) => {
                    setFormData({ ...formData, admission_year: e.target.value });
                    if (errors.admission_year) setErrors({ ...errors, admission_year: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border-2 text-sm font-medium transition-colors
                    ${errors.admission_year ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300 bg-white'}`}
                />
                {errors.admission_year && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.admission_year}
                  </p>
                )}
              </div>

              {/* Admission Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Admission Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Unique key for reference"
                  value={formData.admission_key}
                  onChange={(e) => {
                    setFormData({ ...formData, admission_key: e.target.value });
                    if (errors.admission_key) setErrors({ ...errors, admission_key: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border-2 text-sm font-medium transition-colors
                    ${errors.admission_key ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300 bg-white'}`}
                />
                {errors.admission_key && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.admission_key}
                  </p>
                )}
              </div>

              {/* Opening Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Opening Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.opening_date}
                  onChange={(e) => {
                    setFormData({ ...formData, opening_date: e.target.value });
                    if (errors.opening_date) setErrors({ ...errors, opening_date: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border-2 text-sm font-medium transition-colors
                    ${errors.opening_date ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300 bg-white'}`}
                />
                {errors.opening_date && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.opening_date}
                  </p>
                )}
              </div>

              {/* Closing Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Closing Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.closing_date}
                  onChange={(e) => {
                    setFormData({ ...formData, closing_date: e.target.value });
                    if (errors.closing_date) setErrors({ ...errors, closing_date: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border-2 text-sm font-medium transition-colors
                    ${errors.closing_date ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300 bg-white'}`}
                />
                {errors.closing_date && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.closing_date}
                  </p>
                )}
              </div>

              {/* Max Applications */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Max Applications <span className="text-gray-400 text-xs">(0 for unlimited)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.max_applications}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setFormData({ ...formData, max_applications: isNaN(val) ? 0 : val });
                  }}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 bg-white text-sm font-medium"
                />
              </div>

              {/* Manual Status Override */}
              <div className="space-y-3 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Manual Status Override <span className="text-gray-400 text-xs">(Optional - overrides automatic status)</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_open}
                      onChange={(e) => {
                        const isOpen = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          is_open: isOpen,
                          is_close: isOpen ? false : formData.is_close
                        });
                      }}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Force Open</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_close}
                      onChange={(e) => {
                        const isClose = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          is_close: isClose,
                          is_open: isClose ? false : formData.is_open
                        });
                      }}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Force Close</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  These settings allow manual override of the admission status, regardless of dates.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  placeholder="Additional details about this admission session..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-4 rounded-xl border-2 border-gray-300 bg-white text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button
              variant="outline"
              onClick={() => { setShowCreateDialog(false); resetForm(); }}
              className="h-9 px-5 rounded-lg text-sm border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:scale-105 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              className="h-9 px-6 rounded-lg text-sm bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white hover:scale-105 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) { setSelectedSession(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Admission Session</DialogTitle>
            <DialogDescription>Update admission session details</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-2">
                <label>Admission Code *</label>
                <input
                  type="text"
                  value={formData.admission_code}
                  onChange={(e) => setFormData({ ...formData, admission_code: e.target.value.toUpperCase() })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label>Admission Type *</label>
                <select
                  value={formData.admission_type}
                  onChange={(e) => setFormData({ ...formData, admission_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="">Select admission type</option>
                  {ADMISSION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label>Admission Year *</label>
                <input
                  type="text"
                  value={formData.admission_year}
                  onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label>Admission Key *</label>
                <input
                  type="text"
                  value={formData.admission_key}
                  onChange={(e) => setFormData({ ...formData, admission_key: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label>Opening Date *</label>
                <input
                  type="date"
                  value={formData.opening_date}
                  onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label>Closing Date *</label>
                <input
                  type="date"
                  value={formData.closing_date}
                  onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label>Max Applications</label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_applications}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setFormData({ ...formData, max_applications: isNaN(val) ? 0 : val });
                  }}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                />
              </div>

              {/* Manual Status Override */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Manual Status Override</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_open}
                      onChange={(e) => {
                        const isOpen = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          is_open: isOpen,
                          is_close: isOpen ? false : formData.is_close
                        });
                      }}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm">Force Open</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_close}
                      onChange={(e) => {
                        const isClose = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          is_close: isClose,
                          is_open: isClose ? false : formData.is_open
                        });
                      }}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm">Force Close</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-md border border-gray-300 bg-white text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { setShowEditDialog(false); setSelectedSession(null); resetForm(); }}
              className="h-9 px-5 rounded-lg text-sm border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:scale-105 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSession} 
              className="h-9 px-6 rounded-lg text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-purple-700 text-white hover:scale-105 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admission Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the admission session "{selectedSession?.admission_code}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setSelectedSession(null)}
              className="h-9 px-5 rounded-lg text-sm border border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 font-semibold"
            >
              <X className="w-3.5 h-3.5 mr-2 inline" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSession} 
              className="h-9 px-6 rounded-lg text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white hover:scale-105 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2 inline" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};