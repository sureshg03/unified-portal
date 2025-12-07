import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getLSCCode, getLSCName, getAccessToken } from '@/lib/auth';

interface Material {
  id: number;
  title: string;
  description: string;
  material_type: 'PDF' | 'PPT';
  file_url: string;
  file_size: number;
  programme: string;
  semester: number;
  subject: string;
  lsc_code: string;
  lsc_name: string;
  uploaded_by_name: string;
  status: string;
  views_count: number;
  upload_date: string;
  updated_at: string;
}

export const MaterialsManagement = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const lscCode = getLSCCode();
  const lscName = getLSCName();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    programme: '',
    semester: '',
    subject: '',
    material_type: 'PDF' as 'PDF' | 'PPT',
    file: null as File | null,
  });

  const programmes = ['BBA', 'MBA', 'B.Com', 'M.Com', 'BCA', 'MCA', 'BA', 'MA'];
  const semesters = [1, 2, 3, 4, 5, 6];

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await axios.get('http://localhost:8000/api/lsc-admin/materials/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setMaterials(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      showNotification('error', error.response?.data?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 30 * 1024 * 1024) {
      showNotification('error', 'Maximum file size is 30MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Only PDF and PPT/PPTX files are allowed');
      return;
    }

    const isPPT = file.type.includes('presentation') || file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx');
    setFormData(prev => ({
      ...prev,
      file,
      material_type: isPPT ? 'PPT' : 'PDF'
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.title || !formData.programme || !formData.semester) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      const token = getAccessToken();
      const uploadData = new FormData();
      
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('programme', formData.programme);
      uploadData.append('semester', formData.semester);
      uploadData.append('subject', formData.subject);
      uploadData.append('material_type', formData.material_type);
      uploadData.append('file', formData.file);
      uploadData.append('lsc_code', lscCode || '');
      uploadData.append('lsc_name', lscName || '');

      const response = await axios.post(
        'http://localhost:8000/api/lsc-admin/materials/upload/',
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status === 'success') {
        showNotification('success', 'Material uploaded successfully');
        setUploadDialogOpen(false);
        setFormData({
          title: '',
          description: '',
          programme: '',
          semester: '',
          subject: '',
          material_type: 'PDF',
          file: null,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchMaterials();
      }
    } catch (error: any) {
      console.error('Error uploading material:', error);
      showNotification('error', error.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedMaterial) return;

    try {
      const token = getAccessToken();
      const response = await axios.put(
        `http://localhost:8000/api/lsc-admin/materials/${selectedMaterial.id}/update/`,
        {
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          status: selectedMaterial.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'success') {
        showNotification('success', 'Material updated successfully');
        setEditDialogOpen(false);
        fetchMaterials();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to update material');
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;

    try {
      const token = getAccessToken();
      const response = await axios.delete(
        `http://localhost:8000/api/lsc-admin/materials/${selectedMaterial.id}/delete/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'success') {
        showNotification('success', 'Material deleted successfully');
        setDeleteDialogOpen(false);
        fetchMaterials();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to delete material');
    }
  };

  const openEditDialog = (material: Material) => {
    setSelectedMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      programme: material.programme,
      semester: material.semester.toString(),
      subject: material.subject || '',
      material_type: material.material_type,
      file: null,
    });
    setEditDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-lg font-medium text-gray-700">Loading Materials Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 animate-slide-in-right shadow-2xl rounded-lg overflow-hidden max-w-md ${
          notification.type === 'success' ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
        }`}>
          <div className="p-4 flex items-start gap-3">
            <div className={`mt-0.5 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {notification.type === 'success' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${notification.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                {notification.type === 'success' ? 'Success' : 'Error'}
              </h3>
              <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className={`${notification.type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'} transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Study Materials Management
                </h1>
                <p className="text-blue-100 mt-2 text-lg">
                  Upload, organize, and manage educational materials for your students
                </p>
              </div>
              <button
                onClick={() => setUploadDialogOpen(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Material
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow-md rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Materials</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{materials.length}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">PDF Documents</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {materials.filter(m => m.material_type === 'PDF').length}
                </p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Presentations</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {materials.filter(m => m.material_type === 'PPT').length}
                </p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Views</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {materials.reduce((sum, m) => sum + m.views_count, 0)}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Materials List Section */}
        <div className="bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-gray-900">Uploaded Materials</h2>
            <p className="text-sm text-gray-600 mt-1">Manage and organize your study materials</p>
          </div>
          <div className="p-6">
            {materials.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Materials Uploaded Yet</h3>
                <p className="text-gray-500 mb-6">Start building your study material library for students</p>
                <button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Your First Material
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-5 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-slate-50"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-4 rounded-xl ${
                        material.material_type === 'PDF' ? 'bg-red-100 border-2 border-red-200' : 'bg-orange-100 border-2 border-orange-200'
                      }`}>
                        {material.material_type === 'PDF' ? (
                          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{material.title}</h3>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            material.material_type === 'PDF'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-orange-200 text-orange-800'
                          }`}>
                            {material.material_type}
                          </span>
                        </div>
                        {material.description && (
                          <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {material.programme} - Semester {material.semester}
                          </span>
                          {material.subject && (
                            <span className="font-medium">• {material.subject}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(material.upload_date)}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {material.views_count} views
                          </span>
                          <span>• {formatFileSize(material.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(material.file_url, '_blank')}
                        className="p-3 bg-blue-50 text-blue-600 rounded-lg border-2 border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                        title="View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditDialog(material)}
                        className="p-3 bg-yellow-50 text-yellow-600 rounded-lg border-2 border-yellow-200 hover:bg-yellow-100 hover:shadow-md transition-all duration-200"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMaterial(material);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-3 bg-red-50 text-red-600 rounded-lg border-2 border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Upload Study Material</h2>
                <p className="text-blue-100 text-sm mt-1">Upload PDF or PPT files (Maximum 30MB)</p>
              </div>
              <button
                onClick={() => setUploadDialogOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-3 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                }`}
              >
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">Supports: PDF, PPT, PPTX (Max 30MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Select File
                </label>
                {formData.file && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900">Selected File:</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {formData.file.name} ({formatFileSize(formData.file.size)})
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Material Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Introduction to Business Management"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the material content (optional)"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Programme <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.programme}
                      onChange={(e) => setFormData(prev => ({ ...prev, programme: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select Programme</option>
                      {programmes.map((prog) => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Semester <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((sem) => (
                        <option key={sem} value={sem.toString()}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Financial Accounting (optional)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => setUploadDialogOpen(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-all ${
                  uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Material</h2>
                <p className="text-yellow-100 text-sm mt-1">Update material information (file cannot be changed)</p>
              </div>
              <button
                onClick={() => setEditDialogOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => setEditDialogOpen(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Update Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Delete Material</h2>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-bold">"{selectedMaterial?.title}"</span>?
                This will permanently remove the material from your library.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Delete Material
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
