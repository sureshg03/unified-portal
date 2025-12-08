import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import FileViewer from 'react-file-viewer';
import {
  DocumentTextIcon,
  PresentationChartBarIcon,
  EyeIcon,
  AcademicCapIcon,
  CalendarIcon,
  BookOpenIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Utility function to handle URLs like in Preview page
const getDirectUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('/media/')) return `http://localhost:8000${url}`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
};

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Fetching materials with token:', token ? 'Token present' : 'No token');
      
      const response = await axios.get(
        'http://localhost:8000/api/materials/',
        { headers: { Authorization: `Token ${token}` } }
      );

      console.log('Materials response:', response.data);

      if (response.data.status === 'success') {
        setMaterials(response.data.data);
        console.log('Materials loaded:', response.data.data.length);
        
        if (response.data.message) {
          toast.info(response.data.message);
        }
      } else {
        toast.error(response.data.message || 'Failed to load materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterial = async (material) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('Opening material:', material.id, material.title);
      
      const response = await axios.get(
        `http://localhost:8000/api/materials/${material.id}/view/`,
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        const materialData = response.data.data;
        console.log('Material data received:', materialData);
        console.log('File URL:', materialData.file_url);
        
        // Verify file URL is valid
        if (!materialData.file_url) {
          toast.error('File URL not available');
          return;
        }
        
        // Convert to direct media URL
        materialData.file_url = getDirectUrl(materialData.file_url);
        console.log('Direct URL for modal:', materialData.file_url);
        
        setSelectedMaterial(materialData);
        setViewerOpen(true);
        setPdfLoadError(false);
        
      } else {
        toast.error('Failed to open material');
      }
    } catch (error) {
      console.error('Error viewing material:', error);
      toast.error(error.response?.data?.message || 'Failed to open material');
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedMaterial(null);
    setPdfLoadError(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMaterialIcon = (type) => {
    return type === 'PDF' ? DocumentTextIcon : PresentationChartBarIcon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-7 h-7 text-white" />
            </div>
            Study Materials
          </h1>
          <p className="text-gray-600 mt-2 ml-15">Access course materials uploaded by your LSC</p>
        </motion.div>

        {/* Materials Grid */}
        {materials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
          >
            <BookOpenIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Materials Available</h3>
            <p className="text-gray-500">
              Your LSC hasn't uploaded any study materials yet. Check back later!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material, index) => {
              const Icon = getMaterialIcon(material.material_type);
              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Material Type Badge */}
                  <div className={`h-2 ${material.material_type === 'PDF' ? 'bg-red-500' : 'bg-orange-500'}`} />
                  
                  <div className="p-6">
                    {/* Icon and Type */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                        material.material_type === 'PDF' ? 'bg-red-50' : 'bg-orange-50'
                      }`}>
                        <Icon className={`w-8 h-8 ${
                          material.material_type === 'PDF' ? 'text-red-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        material.material_type === 'PDF' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {material.material_type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                      {material.title}
                    </h3>

                    {/* Description */}
                    {material.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {material.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{material.programme}</span>
                        <span className="text-gray-400">•</span>
                        <span>Semester {material.semester}</span>
                      </div>
                      
                      {material.subject && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BookOpenIcon className="w-4 h-4 text-green-600" />
                          <span>{material.subject}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDate(material.upload_date)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{formatFileSize(material.file_size)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <EyeIcon className="w-4 h-4" />
                        <span>{material.views_count} views</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleViewMaterial(material)}
                      className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg"
                    >
                      <EyeIcon className="w-5 h-5" />
                      View Material
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Material Viewer Modal */}
      {viewerOpen && selectedMaterial && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
            onClick={closeViewer}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden"
              style={{ zIndex: 100000 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMaterial.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedMaterial.programme} • Semester {selectedMaterial.semester}
                    {selectedMaterial.subject && ` • ${selectedMaterial.subject}`}
                  </p>
                </div>
                <button
                  onClick={closeViewer}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>

              {/* PDF/PPT Viewer */}
              <div className="flex-1 bg-white relative overflow-auto">
                {selectedMaterial.material_type === 'PDF' ? (
                  // PDF Viewer using DocViewer
                  <DocViewer
                    documents={[
                      {
                        uri: selectedMaterial.file_url,
                        fileName: selectedMaterial.title,
                        fileType: 'pdf'
                      }
                    ]}
                    pluginRenderers={DocViewerRenderers}
                    config={{
                      header: {
                        disableHeader: true,
                        disableFileName: true,
                        retainURLParams: false
                      },
                      pdfZoom: {
                        defaultZoom: 1.0,
                        zoomJump: 0.1,
                      },
                      pdfVerticalScrollByDefault: true
                    }}
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      overflow: 'auto'
                    }}
                  />
                ) : (
                  // PPT File Information and View Option
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-amber-50 p-8">
                    <div className="text-center max-w-2xl">
                      <div className="mb-6">
                        <PresentationChartBarIcon className="w-24 h-24 text-orange-600 mx-auto mb-4" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {selectedMaterial.title}
                      </h3>
                      <p className="text-base text-gray-700 mb-2">
                        <span className="font-semibold">Subject:</span> {selectedMaterial.subject || 'General'}
                      </p>
                      <p className="text-base text-gray-700 mb-2">
                        <span className="font-semibold">Programme:</span> {selectedMaterial.programme} • Semester {selectedMaterial.semester}
                      </p>
                      <p className="text-sm text-gray-600 mb-6">
                        Uploaded: {formatDate(selectedMaterial.upload_date)}
                      </p>
                      
                      <div className="bg-white border-2 border-orange-200 rounded-xl p-6 mb-6 shadow-lg">
                        <p className="text-sm text-gray-700 mb-4">
                          PowerPoint presentations cannot be previewed directly in the browser. 
                          Please open the file in a new tab to view using your browser's built-in viewer.
                        </p>
                        <a
                          href={selectedMaterial.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          <EyeIcon className="w-5 h-5" />
                          Open PowerPoint in New Tab
                        </a>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p className="mb-1">💡 Tip: The file will open in a new browser tab</p>
                        <p>You can view, zoom, and navigate through the slides</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Uploaded on {formatDate(selectedMaterial.upload_date)}</span>
                  <span className="flex items-center gap-2">
                    <EyeIcon className="w-4 h-4" />
                    {selectedMaterial.views_count} views
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Materials;
