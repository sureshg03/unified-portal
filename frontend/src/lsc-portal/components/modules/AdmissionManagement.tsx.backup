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
  Users
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

  useEffect(() => {
    fetchSessions();
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
      OPEN: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      CLOSED: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      SCHEDULED: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      EXPIRED: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CLOSED;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading admission sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Admission Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage admission sessions and control online application periods
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSessions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            New Admission
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {sessions.filter(s => s.status === 'OPEN').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {sessions.filter(s => s.status === 'SCHEDULED').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {sessions.filter(s => s.status === 'CLOSED').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{sessions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Admission Sessions</CardTitle>
          <CardDescription>View and manage all admission sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Admission Sessions</h3>
                <p className="text-gray-600 mb-4">
                  Create your first admission session to start accepting applications
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Admission Session
                </Button>
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="border-l-4 border-l-indigo-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{session.admission_code}</h3>
                          {getStatusBadge(session.status)}
                          {!session.is_active && (
                            <Badge variant="outline" className="bg-gray-100">Inactive</Badge>
                          )}
                          {(session.is_open || session.is_close) && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                              Manual Override
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Type</p>
                            <p className="font-medium">
                              {ADMISSION_TYPES.find(t => t.value === session.admission_type)?.label}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Year</p>
                            <p className="font-medium">{session.admission_year}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Opening Date</p>
                            <p className="font-medium">
                              {new Date(session.opening_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Closing Date</p>
                            <p className="font-medium">
                              {new Date(session.closing_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            <span className="text-sm">
                              {session.current_applications} / {session.max_applications === 0 ? 'Unlimited' : session.max_applications} applications
                            </span>
                          </div>
                          {session.days_remaining > 0 && session.status === 'OPEN' && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="text-sm">{session.days_remaining} days remaining</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {(session.status === 'OPEN' || session.status === 'CLOSED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(session)}
                          >
                            {session.status === 'OPEN' ? (
                              <><PowerOff className="w-4 h-4 mr-1" /> Close</>
                            ) : (
                              <><Power className="w-4 h-4 mr-1" /> Open</>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(session)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setSelectedSession(session);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-white">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-purple-600">Create New Admission Session</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
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

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => { setShowCreateDialog(false); resetForm(); }}
              className="h-11 px-6 rounded-xl border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              className="h-11 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Admission
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
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedSession(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSession} className="bg-gradient-to-r from-indigo-600 to-purple-600">
              Update Admission
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
            <AlertDialogCancel onClick={() => setSelectedSession(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};