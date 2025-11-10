import React, { useState, useEffect, Component, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaCheckCircle, FaImage, FaSignature, FaTrash, FaEye } from 'react-icons/fa';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import PropTypes from 'prop-types';
import StepProgressBar from '../components/StepProgressBar';
import debounce from 'lodash/debounce';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
          <div className="p-10 bg-white rounded-2xl shadow-2xl text-center">
            <h2 className="text-4xl font-bold text-red-600 font-poppins">Something Went Wrong</h2>
            <p className="mt-4 text-gray-600 font-inter text-lg">Please try again or refresh the page.</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-red-500 font-inter">Error Details</summary>
                <pre className="mt-2 text-sm text-gray-700">
                  {this.state.error?.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={this.resetError}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-inter text-lg transition duration-300"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-inter text-lg transition duration-300"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

const ApplicationPage4 = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [files, setFiles] = useState({
    photo: null,
    signature: null,
    community_certificate: null,
    aadhar_card: null,
    transfer_certificate: null,
  });
  const [previews, setPreviews] = useState({
    photo: null,
    signature: null,
    community_certificate: null,
    aadhar_card: null,
    transfer_certificate: null,
  });
  const [uploadStatus, setUploadStatus] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [dragActive, setDragActive] = useState({
    photo: false,
    signature: false,
    community_certificate: false,
    aadhar_card: false,
    transfer_certificate: false,
  });
  const [uploading, setUploading] = useState({
    photo: false,
    signature: false,
    community_certificate: false,
    aadhar_card: false,
    transfer_certificate: false,
  });
  const [activeGuideline, setActiveGuideline] = useState('photo');
  const [fieldErrors, setFieldErrors] = useState({
    photo: false,
    signature: false,
    community_certificate: false,
    aadhar_card: false,
    transfer_certificate: false,
  });

  const fileInputRefs = useRef({
    photo: null,
    signature: null,
    community_certificate: null,
    aadhar_card: null,
    transfer_certificate: null,
  });

  const BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = debounce(() => setShowScrollTop(window.scrollY > 300), 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchUserEmail = async () => {
      if (!token) {
        if (mounted) {
          setError('No authentication token found. Please log in again.');
          toast.error('Please login again.');
          navigate('/student/login');
        }
        return;
      }

      setIsLoadingEmail(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/current-user-email/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (mounted && response.data?.status === 'success') {
          setUserEmail(response.data.data?.email || '');
          localStorage.setItem('userEmail', response.data.data?.email || '');
        } else {
          throw new Error(response.data?.message || 'Failed to fetch user email');
        }
      } catch (err) {
        if (mounted) {
          const message = err.response?.data?.message || 'Error connecting to server.';
          setError(message);
          toast.error(message);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            navigate('/student/login');
          }
        }
      } finally {
        if (mounted) setIsLoadingEmail(false);
      }
    };

    fetchUserEmail();
    return () => { mounted = false; };
  }, [navigate, token]);

  const validateImageDimensions = useCallback((file, type, callback) => {
    // Dimension validation removed - no longer required
    callback(true);
  }, []);

  const handleFileChange = useCallback((e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = {
      photo: ['image/jpeg', 'image/jpg'],
      signature: ['image/jpeg', 'image/jpg'],
      community_certificate: ['image/jpeg', 'image/jpg', 'application/pdf'],
      aadhar_card: ['image/jpeg', 'image/jpg', 'application/pdf'],
      transfer_certificate: ['image/jpeg', 'image/jpg', 'application/pdf'],
    }[type];

    if (!validTypes.includes(file.type)) {
      setUploadStatus((prev) => ({ ...prev, [type]: 'error' }));
      toast.error(`Invalid file type for ${type.replace('_', ' ')}. Allowed: ${validTypes.join(', ')}`);
      return;
    }

    const maxSize = ['community_certificate', 'transfer_certificate'].includes(type) && file.type === 'application/pdf'
      ? 300 * 1024  // 300 KB for PDFs
      : ['photo', 'signature'].includes(type)
      ? (type === 'photo' ? 30 * 1024 : 20 * 1024)  // 30 KB for photo, 20 KB for signature
      : 300 * 1024;  // 300 KB for other documents

    if (file.size > maxSize) {
      setUploadStatus((prev) => ({ ...prev, [type]: 'error' }));
      toast.error(`File size for ${type.replace('_', ' ')} exceeds ${maxSize / 1024 / 1024}MB`);
      return;
    }

    const processFile = () => {
      setUploading((prev) => ({ ...prev, [type]: true }));
      const timer = setTimeout(() => {
        setFiles((prev) => ({ ...prev, [type]: file }));
        setUploadStatus((prev) => ({ ...prev, [type]: 'selected' }));
        setFieldErrors((prev) => ({ ...prev, [type]: false }));

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            setPreviews((prev) => ({ ...prev, [type]: reader.result }));
            setUploading((prev) => ({ ...prev, [type]: false }));
            URL.revokeObjectURL(reader.result);
          };
          reader.onerror = () => {
            toast.error(`Failed to read ${type} for preview.`);
            setUploading((prev) => ({ ...prev, [type]: false }));
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews((prev) => ({ ...prev, [type]: null }));
          setUploading((prev) => ({ ...prev, [type]: false }));
        }

        setError('');
        toast.success(`File selected for ${type.replace('_', ' ')}`);
      }, 200);

      return () => clearTimeout(timer);
    };

    if (['photo', 'signature'].includes(type)) {
      validateImageDimensions(file, type, (isValid) => {
        if (isValid) {
          processFile();
        } else {
          setUploadStatus((prev) => ({ ...prev, [type]: 'error' }));
        }
      });
    } else {
      processFile();
    }
  }, [validateImageDimensions]);

  const handleDrag = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive((prev) => ({ ...prev, [type]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive((prev) => ({ ...prev, [type]: false }));
    }
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const syntheticEvent = { target: { files: [file] } };
      handleFileChange(syntheticEvent, type);
    }
  }, [handleFileChange]);

  const handleRemoveFile = useCallback((type, e) => {
    e.stopPropagation();
    setFiles((prev) => ({ ...prev, [type]: null }));
    setPreviews((prev) => ({ ...prev, [type]: null }));
    setUploadStatus((prev) => ({ ...prev, [type]: null }));
    setFieldErrors((prev) => ({ ...prev, [type]: true }));
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type].value = null;
    }
    toast.success(`Removed ${type.replace('_', ' ')}`);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!userEmail) {
      toast.error('User email not found. Please try logging in again.');
      return;
    }

    const missingFields = Object.keys(files).filter((key) => !files[key]);
    if (missingFields.length > 0) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        missingFields.forEach((key) => {
          newErrors[key] = true;
        });
        return newErrors;
      });
      toast.error('Please upload all required documents.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });
    formData.append('email', userEmail);

    try {
      const response = await axios.post(`${BASE_URL}/api/upload-documents/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Increased to 60 seconds for larger files
      });

      if (response.data?.status === 'success') {
        setUploadStatus((prev) => {
          const newStatus = { ...prev };
          Object.keys(files).forEach((key) => {
            if (files[key]) newStatus[key] = 'success';
          });
          return newStatus;
        });
        toast.success('Documents uploaded successfully!');
        setTimeout(() => navigate('/student/application/page5'), 1000);
      } else {
        throw new Error(response.data?.message || 'Failed to upload documents');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Network error occurred while uploading documents. Please try again.';
      console.error('Upload error:', err);
      toast.error(errorMessage);
      setError(errorMessage);
      setUploadStatus((prev) => {
        const newStatus = { ...prev };
        Object.keys(files).forEach((key) => {
          if (files[key]) newStatus[key] = 'error';
        });
        return newStatus;
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [files, userEmail, navigate, token]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const guidelines = useMemo(() => ({
    photo: [
      'Format: JPG/JPEG',
      'Size: Max 30 KB',
      'Recent photograph taken within the last 6 months',
      'Clear and good quality image',
    ],
    signature: [
      'Format: JPG/JPEG',
      'Size: Max 20 KB',
      'Use black or blue ink for clear visibility',
      'Sign on white paper for better contrast',
    ],
    community_certificate: [
      'Format: JPG/JPEG or PDF',
      'Size: Max 300 KB',
      'Ensure the document is clear and legible',
      'Include all relevant details and stamps',
    ],
    aadhar_card: [
      'Format: JPG/JPEG or PDF',
      'Size: Max 300 KB',
      'Ensure all details are visible',
      'Both front and back (if applicable)',
    ],
    transfer_certificate: [
      'Format: JPG/JPEG or PDF',
      'Size: Max 300 KB',
      'Include all institutional stamps and signatures',
      'Ensure clarity of text and details',
    ],
  }), []);

  const allFieldsFilled = useMemo(() => {
    return Object.values(files).every((file) => file !== null);
  }, [files]);

  const renderUploadCard = useCallback((type, label, accept, isImageType, dimensions) => {
    const { gradient, border, borderHover } = {
      photo: {
        gradient: 'from-indigo-600 to-purple-700',
        border: 'border-indigo-500',
        borderHover: 'border-indigo-300',
      },
      signature: {
        gradient: 'from-purple-600 to-pink-600',
        border: 'border-purple-500',
        borderHover: 'border-purple-300',
      },
      community_certificate: {
        gradient: 'from-blue-600 to-cyan-600',
        border: 'border-blue-500',
        borderHover: 'border-blue-300',
      },
      aadhar_card: {
        gradient: 'from-green-600 to-teal-600',
        border: 'border-green-500',
        borderHover: 'border-green-300',
      },
      transfer_certificate: {
        gradient: 'from-orange-600 to-red-600',
        border: 'border-orange-500',
        borderHover: 'border-orange-300',
      },
    }[type];

    const containerVariants = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    };

    return (
      <motion.div
        onMouseEnter={() => setActiveGuideline(type)}
        className="relative"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          whileHover={{ y: -2, borderColor: fieldErrors[type] ? 'border-red-500' : borderHover }}
          className={`relative bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 ${fieldErrors[type] ? 'border-red-500' : border} transition-all duration-200 ${dragActive[type] ? 'bg-blue-100/50 border-blue-600' : ''} ${uploading[type] ? 'animate-pulse' : ''}`}
          style={{ width: dimensions?.width || 260, height: dimensions?.height || 195 }}
        >
          {uploading[type] && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 animate-spin" />
            </div>
          )}
          {previews[type] && isImageType ? (
            <div className="relative w-full h-full">
              <img
                src={previews[type]}
                alt={`${type} preview`}
                className={`w-full h-full rounded-xl ${type === 'signature' ? 'object-contain' : 'object-cover'}`}
                loading="lazy"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleRemoveFile(type, e)}
                className="absolute top-3 right-3 p-2.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 z-40 pointer-events-auto"
                title="Remove File"
              >
                <FaTrash className="h-4 w-4" />
              </motion.button>
              {uploadStatus[type] === 'success' && (
                <div className="absolute top-3 left-3 z-40 pointer-events-auto">
                  <FaCheckCircle className="text-green-500 text-xl" title="Upload Successful" />
                </div>
              )}
              <input
                type="file"
                accept={accept}
                ref={(el) => (fileInputRefs.current[type] = el)}
                onChange={(e) => handleFileChange(e, type)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                disabled={isSubmitting || isLoadingEmail || uploading[type]}
                onDragEnter={(e) => handleDrag(e, type)}
                onDragLeave={(e) => handleDrag(e, type)}
                onDragOver={(e) => handleDrag(e, type)}
                onDrop={(e) => handleDrop(e, type)}
                aria-label={`Upload ${label}`}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              {isImageType ? (
                type === 'photo' ? <FaImage className="text-blue-600 text-4xl mb-2" /> :
                <FaSignature className="text-blue-600 text-4xl mb-2" />
              ) : (
                <FaUpload className="text-blue-600 text-4xl mb-2" />
              )}
              <p className="text-gray-800 font-inter text-sm font-semibold text-center">{label}</p>
              <p className="text-gray-500 text-xs mt-2 text-center">
                {accept.includes('pdf') ? 'JPG, JPEG, PDF (max 300KB)' : 
                 type === 'photo' ? 'JPG, JPEG (max 30KB)' :
                 type === 'signature' ? 'JPG, JPEG (max 20KB)' :
                 'JPG, JPEG, PDF (max 300KB)'}
              </p>
              <input
                type="file"
                accept={accept}
                ref={(el) => (fileInputRefs.current[type] = el)}
                onChange={(e) => handleFileChange(e, type)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                disabled={isSubmitting || isLoadingEmail || uploading[type]}
                onDragEnter={(e) => handleDrag(e, type)}
                onDragLeave={(e) => handleDrag(e, type)}
                onDragOver={(e) => handleDrag(e, type)}
                onDrop={(e) => handleDrop(e, type)}
                aria-label={`Upload ${label}`}
              />
            </div>
          )}
        </motion.div>
        {fieldErrors[type] && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-xs font-inter mt-2 text-center"
          >
            This field is required
          </motion.p>
        )}
        {!isImageType && files[type] && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-between px-3"
          >
            <p className="text-sm text-gray-600 font-inter truncate max-w-[180px]">
              {files[type]?.name || 'No file name'}
            </p>
            <div className="flex items-center gap-2">
              {previews[type] && (
                <motion.button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); window.open(previews[type], '_blank'); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-inter"
                  title="Preview File"
                >
                  <FaEye className="h-4 w-4 mr-1" />
                  Preview
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleRemoveFile(type, e)}
                className="p-2.5 bg-red-500 text-white rounded-full"
                title="Remove File"
              >
                <FaTrash className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }, [dragActive, files, previews, uploadStatus, uploading, handleFileChange, handleDrag, handleDrop, handleRemoveFile, isSubmitting, isLoadingEmail, fieldErrors]);

  const renderGuidelines = useCallback(() => {
    const guidelineVariants = {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[360px] h-[450px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg p-6 border-2 border-dashed border-purple-300"
      >
        <h3 className="text-2xl font-bold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
          Guidelines:
        </h3>
        <h3 className="text-xl font-semibold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
          {activeGuideline.replace('_', ' ').toUpperCase()}
        </h3>
        <div className="h-[380px] overflow-y-auto scrollbar-thin pr-3">
          <AnimatePresence mode="wait">
            <motion.ul
              key={activeGuideline}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={guidelineVariants}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {guidelines[activeGuideline]?.map((guideline, index) => (
                <motion.li
                  key={index}
                  className="flex items-start text-gray-800 font-inter text-sm bg-purple-50/50 rounded-lg p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <FaCheckCircle className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-purple-600">{guideline.split(':')[0]}:</span>
                    {guideline.split(':').slice(1).join(':')}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }, [activeGuideline, guidelines]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="p-10 bg-white rounded-2xl shadow-2xl">
          <h2 className="text-4xl font-semibold text-red-600 font-poppins">Failed to Load Data</h2>
          <p className="mt-4 text-gray-600 font-inter text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-inter text-lg transition duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-pink-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="particle-bg"></div>
        </div>
        <Toaster position="top-right" />
        <div className="max-w-8xl mx-auto">
          <StepProgressBar currentStep="/application/page4" />
          <motion.div
            className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border-2 border-dashed border-blue-300 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-4xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-900 text-center mb-6">
              Document Upload
            </h2>
            <p className="text-gray-600 font-inter text-center mb-8 text-lg">
              Upload your documents with the specified formats for a smooth application process. All fields are required.
            </p>

            {/* Upload Guidelines Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200"
            >
              <h3 className="text-2xl font-bold font-poppins text-center text-blue-800 mb-4">
                📋 Upload Guidelines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-700 mb-2">📸 Photo Requirements</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• JPG/JPEG format only</li>
                    <li>• Maximum 30 KB file size</li>
                    <li>• Recent photo (within 6 months)</li>
                    <li>• Clear and good quality</li>
                  </ul>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-700 mb-2">✍️ Signature Requirements</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• JPG/JPEG format only</li>
                    <li>• Maximum 20 KB file size</li>
                    <li>• Black or blue ink preferred</li>
                    <li>• Sign on white paper</li>
                  </ul>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-700 mb-2">📄 Document Requirements</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• JPG/JPEG or PDF format</li>
                    <li>• Maximum 300 KB per file</li>
                    <li>• All text must be legible</li>
                    <li>• Include all stamps/signatures</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Important: Ensure all documents are clear and readable. Blurry or incomplete documents may result in application rejection.
                </p>
              </div>
            </motion.div>

            {isLoadingEmail ? (
              <div className="flex justify-center mb-8">
                <div className="rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
                  <div className="order-1 lg:order-none">{renderGuidelines()}</div>
                  <div className="order-2 flex flex-col gap-8">
                    <div className="flex justify-center gap-8 flex-wrap">
                      {renderUploadCard('photo', 'Passport Photo', '.jpg,.jpeg', true, { width: 240, height: 300 })}
                      {renderUploadCard('signature', 'Signature', '.jpg,.jpeg', true, { width: 240, height: 300 })}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {renderUploadCard('community_certificate', 'Community Certificate', '.jpg,.jpeg,.pdf', false, { width: 260, height: 195 })}
                      {renderUploadCard('aadhar_card', 'Aadhar Card', '.jpg,.jpeg,.pdf', false, { width: 260, height: 195 })}
                      {renderUploadCard('transfer_certificate', 'Transfer Certificate', '.jpg,.jpeg,.pdf', false, { width: 260, height: 195 })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => navigate('/student/application/page3')}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-inter text-lg font-semibold shadow-lg"
                    disabled={isSubmitting || isLoadingEmail}
                    title="Go to Previous Page"
                  >
                    <span className="flex items-center">
                      <ArrowLeft className="h-6 w-6 mr-2" />
                      Back
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-inter text-lg font-semibold shadow-lg ${isSubmitting || isLoadingEmail || !allFieldsFilled ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-700 hover:to-indigo-700'}`}
                    disabled={isSubmitting || isLoadingEmail || !allFieldsFilled}
                    title="Submit Documents and Proceed"
                  >
                    <span className="flex items-center">
                      <ArrowRight className="h-6 w-6 mr-2" />
                      {isSubmitting ? 'Uploading...' : 'Submit & Next'}
                    </span>
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 right-8"
            >
              <motion.button
                type="button"
                onClick={scrollToTop}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg"
                title="Scroll to Top"
              >
                <ArrowUp className="h-6 w-6" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap');
            .font-inter { font-family: 'Inter', sans-serif; }
            .font-poppins { font-family: 'Poppins', sans-serif; }
            input[type="file"]::-webkit-file-upload-button { display: none; }
            input[type="file"] { cursor: pointer; }
            [title]:hover:after {
              content: attr(title);
              position: absolute;
              background: rgba(0, 0, 0, 0.85);
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 14px;
              z-index: 50;
              white-space: nowrap;
              transform: translate(-50%, 0);
              top: calc(100% + 8px);
              left: 50%;
            }
            button:hover { border: none !important; }
            .scrollbar-thin::-webkit-scrollbar {
              width: 6px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: rgba(139, 92, 246, 0.7);
              border-radius: 3px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.05);
            }
            .particle-bg {
              position: absolute;
              inset: 0;
              background: transparent;
              overflow: hidden;
            }
            .particle-bg::before {
              content: '';
              position: absolute;
              width: 3px;
              height: 3px;
              background: rgba(139, 92, 246, 0.4);
              border-radius: 50%;
              animation: particle-float 20s infinite linear;
              top: 15%;
              left: 25%;
            }
            @keyframes particle-float {
              0% { transform: translate(0, 0); opacity: 0.6; }
              50% { opacity: 0.9; }
              100% { transform: translate(-120px, -120px); opacity: 0; }
            }
            @media (max-width: 1024px) {
              .lg\\:grid-cols-\\[_360px_1fr_\\] {
                grid-template-columns: 1fr;
              }
              .max-w-7xl {
                max-width: 95%;
              }
              .text-4xl {
                font-size: 2.25rem;
              }
              .text-lg {
                font-size: 1rem;
              }
            }
            @media (max-width: 640px) {
              .max-w-7xl {
                max-width: 100%;
                padding-left: 1rem;
                padding-right: 1rem;
              }
              .max-w-\\[360px\\] {
                max-width: 100%;
              }
              .text-4xl {
                font-size: 2rem;
              }
              .text-lg {
                font-size: 1rem;
              }
              .text-sm {
                font-size: 0.875rem;
              }
              .p-8 {
                padding: 1.5rem;
              }
              .gap-8 {
                gap: 1.5rem;
              }
            }
          `}
        </style>
      </motion.div>
    </ErrorBoundary>
  );
};

export default React.memo(ApplicationPage4);