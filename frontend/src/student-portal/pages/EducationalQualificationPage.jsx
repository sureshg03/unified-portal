import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { ArrowLeft, ArrowRight, ArrowUp, Info } from 'lucide-react';
import StepProgressBar from '../components/StepProgressBar';
import QualificationsAndSemesters from './QualificationsAndSemesters';
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="p-8 bg-white rounded-2xl shadow-lg text-center">
            <h2 className="text-xl font-semibold text-red-600 font-montserrat">Something Went Wrong</h2>
            <p className="mt-3 text-gray-600 text-base font-roboto">Please refresh the page or contact support.</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-red-500 font-medium text-sm">Error Details</summary>
                <pre className="mt-3 text-xs text-gray-700 font-roboto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-semibold font-roboto transition duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const EducationalQualificationPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [formData, setFormData] = useState({
    email: '',
    name_initial: '',
    qualifications: [
      { course: 'S.S.L.C', institute_name: '', board: '', subject_studied: '', reg_no: '', percentage: '', month_year: '', mode_of_study: '', sslc_marksheet_url: '', uploadProgress: 0 },
      { course: 'HSC', institute_name: '', board: '', subject_studied: '', reg_no: '', percentage: '', month_year: '', mode_of_study: '', hsc_marksheet_url: '', uploadProgress: 0 },
      { course: '', institute_name: '', university: '', subject_studied: '', reg_no: '', percentage: '', month_year: '', mode_of_study: '', ug_marksheet_url: '', uploadProgress: 0 },
    ],
    current_designation: '',
    current_institute: '',
    years_experience: '',
    annual_income: '',
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!token) {
        toast.error('Please login again.');
        navigate('/student/login');
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:8000/api/application/page3/', {
          headers: { Authorization: `Token ${token}` },
          timeout: 30000,
        });
        console.log('API Response:', res.data);
        if (res.data.status === 'success' && res.data.data && mounted) {
          const data = res.data.data;
          console.log('Raw data.qualifications:', data.qualifications, 'isArray:', Array.isArray(data.qualifications));
          const defaultQualifications = [
            { course: 'S.S.L.C', institute_name: '', board: '', subject_studied: '', reg_no: '', percentage: '', month_year: '', mode_of_study: '', sslc_marksheet_url: '', uploadProgress: 0 },
            { course: 'HSC', institute_name: '', board: '', subject_studied: '', reg_no: '', percentage: '', month_year: '', mode_of_study: '', hsc_marksheet_url: '', uploadProgress: 0 },
            { course: '', institute_name: '', university: '', subject_studied: '', reg_no: '', percentage: '', month_year: '', mode_of_study: '', ug_marksheet_url: '', uploadProgress: 0 },
          ];
          const fetchedQualifications = Array.isArray(data.qualifications) ? data.qualifications : [];
          const sslcQual = fetchedQualifications.find(q => q.course === 'S.S.L.C') || defaultQualifications[0];
          const hscQual = fetchedQualifications.find(q => q.course === 'HSC') || defaultQualifications[1];
          const otherQual = fetchedQualifications.find(q => !['S.S.L.C', 'HSC'].includes(q.course)) || defaultQualifications[2];

          const mappedQualifications = [
            {
              ...defaultQualifications[0],
              ...sslcQual,
              sslc_marksheet_url: sslcQual.sslc_marksheet_url || '',
              percentage: sslcQual.percentage != null ? sslcQual.percentage.toString() : '',
            },
            {
              ...defaultQualifications[1],
              ...hscQual,
              hsc_marksheet_url: hscQual.hsc_marksheet_url || '',
              percentage: hscQual.percentage != null ? hscQual.percentage.toString() : '',
            },
            {
              ...defaultQualifications[2],
              ...otherQual,
              ug_marksheet_url: otherQual.ug_marksheet_url || '',
              university: otherQual.university || otherQual.board || '',
              percentage: otherQual.percentage != null ? otherQual.percentage.toString() : '',
            },
          ];

          console.log('Mapped Qualifications:', mappedQualifications);
          try {
            setFormData(prev => ({
              ...prev,
              email: data.email || '',
              name_initial: data.name_initial || '',
              qualifications: mappedQualifications,
              current_designation: data.current_designation || '',
              current_institute: data.current_institute || '',
              years_experience: data.years_experience != null ? data.years_experience.toString() : '',
              annual_income: data.annual_income != null ? data.annual_income.toString() : '',
            }));
            console.log('formData set successfully');
          } catch (setError) {
            console.error('Error setting formData:', setError);
            setFetchError('Failed to process fetched data');
          }
        }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Network or server error';
        console.error('Fetch Error:', err, { response: err.response?.data });
        setFetchError(message);
        toast.error('Error fetching data: ' + message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [navigate, token]);

  const validateForm = useCallback(() => {
    if (!formData || !Array.isArray(formData.qualifications)) {
      console.error('Invalid formData in validateForm:', formData);
      return;
    }
    const errors = {};
    formData.qualifications.forEach((qual, idx) => {
      const qualErrors = [];
      const requiredFields = ['course', 'institute_name', 'subject_studied', 'reg_no', 'percentage', 'month_year', 'mode_of_study'];
      const isStatic = ['S.S.L.C', 'HSC'].includes(qual.course);
      requiredFields.forEach(field => {
        const value = qual[field]?.toString().trim();
        if (!value) {
          qualErrors.push(`${field.replace(/_/g, ' ')} is required for ${qual.course || 'Additional Qualification'}`);
        }
      });
      const boardOrUniversityField = isStatic ? 'board' : 'university';
      if (!qual[boardOrUniversityField]?.toString().trim()) {
        qualErrors.push(`${isStatic ? 'Board' : 'University'} is required for ${qual.course || 'Additional Qualification'}`);
      }
      const percentageValue = parseFloat(qual.percentage);
      if (qual.percentage && (isNaN(percentageValue) || percentageValue < 0 || percentageValue > 100)) {
        qualErrors.push(`Percentage must be a valid number between 0 and 100 for ${qual.course || 'Additional Qualification'}`);
      }
      if (qual.month_year && !/^\d{2}\/\d{4}$/.test(qual.month_year)) {
        qualErrors.push(`Month & Year must be in MM/YYYY format for ${qual.course || 'Additional Qualification'}`);
      }
      if (qual.course === 'S.S.L.C' && !qual.sslc_marksheet_url?.trim()) {
        qualErrors.push(`SSLC Marksheet upload is required`);
      }
      if (qual.course === 'HSC' && !qual.hsc_marksheet_url?.trim()) {
        qualErrors.push(`HSC Marksheet upload is required`);
      }
      if (!isStatic && qual.course && !qual.ug_marksheet_url?.trim()) {
        qualErrors.push(`UG Provisional Certificate upload is required`);
      }
      if (qualErrors.length > 0) {
        errors[`qualification_${idx}`] = qualErrors;
      }
    });
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    console.log('Validation Result:', { errors, isValid, formData: formData.qualifications });
  }, [formData]);

  // Debounce validation to avoid running on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateForm();
    }, 500); // Only validate 500ms after user stops typing
    return () => clearTimeout(timeoutId);
  }, [formData, validateForm]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    // Update immediately without validation for fast typing
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    // Validate only on blur for better performance
    if (['years_experience', 'annual_income'].includes(name)) {
      const trimmedValue = value.trim();
      if (trimmedValue !== '' && (isNaN(parseFloat(trimmedValue)) || parseFloat(trimmedValue) < 0)) {
        setFormData(prev => ({ ...prev, [name]: '' }));
        toast.error(`${name === 'years_experience' ? 'Years of Experience' : 'Annual Income'} must be a valid non-negative number`);
      } else {
        setFormData(prev => ({ ...prev, [name]: trimmedValue }));
      }
    }
    // Trigger validation after blur
    validateForm();
  }, [validateForm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please login again.');
      navigate('/student/login');
      return;
    }
    if (Object.keys(formErrors).length > 0) {
      toast.error('Please fix all errors before submitting.');
      return;
    }
    // Extract marksheet URLs from qualifications for top-level submission
    const sslcQual = formData.qualifications.find(q => q.course === 'S.S.L.C');
    const hscQual = formData.qualifications.find(q => q.course === 'HSC');
    const ugQual = formData.qualifications.find(q => q.course && !['S.S.L.C', 'HSC'].includes(q.course));
    
    const cleanedFormData = {
      ...formData,
      // Include marksheet URLs at top level for backend validation
      sslc_marksheet_url: sslcQual?.sslc_marksheet_url?.trim() || '',
      hsc_marksheet_url: hscQual?.hsc_marksheet_url?.trim() || '',
      ug_marksheet_url: ugQual?.ug_marksheet_url?.trim() || '',
      qualifications: formData.qualifications.map(qual => {
        const isStatic = ['S.S.L.C', 'HSC'].includes(qual.course);
        return {
          course: qual.course,
          institute_name: qual.institute_name?.trim() || '',
          [isStatic ? 'board' : 'university']: qual[isStatic ? 'board' : 'university']?.trim() || '',
          subject_studied: qual.subject_studied?.trim() || '',
          reg_no: qual.reg_no?.trim() || '',
          percentage: qual.percentage?.trim() ? parseFloat(qual.percentage) : null,
          month_year: qual.month_year?.trim() || '',
          mode_of_study: qual.mode_of_study?.trim() || '',
        };
      }).filter(qual => {
        return ['course', 'institute_name', 'subject_studied', 'reg_no', 'percentage', 'month_year', 'mode_of_study'].every(field => qual[field]?.toString().trim()) &&
               ((qual.course === 'S.S.L.C' && qual.board) || (qual.course === 'HSC' && qual.board) || (qual.course && qual.university));
      }),
      years_experience: formData.years_experience?.trim() ? parseFloat(formData.years_experience) : null,
      annual_income: formData.annual_income?.trim() ? parseFloat(formData.annual_income) : null,
    };
    console.log('Submitting Payload:', cleanedFormData);
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/application/page3/', cleanedFormData, {
        headers: { Authorization: `Token ${token}` },
      });
      if (response.status === 200 && response.data.status === 'success') {
        toast.success('Page 3 submitted successfully!');
        setTimeout(() => navigate('/student/application/page4'), 1000);
      } else {
        toast.error(response.data.message || 'Submission failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data || 'Error submitting form';
      if (typeof errorMessage === 'object') {
        const errorDetails = Object.entries(errorMessage)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join('; ') : value}`)
          .join('; ');
        toast.error(`Submission failed: ${errorDetails}`);
        setFormErrors(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, formErrors, navigate, token]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 font-montserrat">Failed to Load Data</h2>
          <p className="mt-3 text-gray-600 text-base font-roboto">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-semibold font-roboto transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBoundary>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
        >
          <Toaster position="top-right" />
          <div className="w-full max-w-8xl mx-auto">
            <StepProgressBar currentStep="/application/page3" />
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold font-montserrat text-purple-800 text-center mb-8">
                Educational Qualifications
              </h2>
              {loading && (
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"
                  />
                </div>
              )}
              <div className="mb-8 p-6 bg-gray-100 rounded-lg">
                <div className="flex items-center mb-4">
                  <Info className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-xl font-semibold font-montserrat text-purple-700">Instructions</h3>
                </div>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 font-roboto text-base">
                  <li>Enter details for S.S.L.C, HSC, and one additional qualification (e.g., UG/Diploma).</li>
                  <li>Upload marksheets or certificates (PDF, max 2MB) for each qualification.</li>
                  <li>Select Month & Year using the calendar picker.</li>
                  <li>Percentage should be between 0 and 100 (e.g., 85.5).</li>
                  <li>Resolve all errors (shown in red) to enable the "Save and Next" button.</li>
                </ul>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold font-montserrat text-purple-700 mb-6">
                      Student Information
                    </h3>
                    {[
                      { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
                      { name: 'name_initial', label: 'Name with Initial', type: 'text', placeholder: 'Enter name with initial' },
                    ].map(({ name, label, type, placeholder }) => (
                      <div key={name}>
                        <label className="block text-base font-medium text-gray-800 font-roboto mb-2">
                          {label} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={type}
                          name={name}
                          value={formData[name] || ''}
                          disabled={true}
                          placeholder={placeholder}
                          className="w-full py-3 px-4 bg-gray-100 rounded-lg border border-purple-300 text-base font-roboto font-medium text-gray-900 placeholder-gray-400 cursor-not-allowed focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition duration-200"
                          aria-label={label}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <QualificationsAndSemesters
                  formData={formData}
                  setFormData={setFormData}
                  loading={loading}
                  errors={formErrors}
                />
                <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold font-montserrat text-purple-700 mb-6">
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[
                      { name: 'current_designation', label: 'Current Designation', type: 'text', placeholder: 'Enter your current designation' },
                      { name: 'current_institute', label: 'Current Institution', type: 'text', placeholder: 'Enter your current institution' },
                      { name: 'years_experience', label: 'Years of Experience', type: 'number', min: 0, step: 0.1, placeholder: 'Enter years of experience' },
                      { name: 'annual_income', label: 'Annual Income (in Lakhs)', type: 'number', min: 0, step: 0.1, placeholder: 'Enter annual income' },
                    ].map(({ name, label, type, min, step, placeholder }) => (
                      <div key={name} className="relative group">
                        <label className="block text-base font-medium text-gray-800 font-roboto mb-2">
                          {label}
                        </label>
                        <input
                          type={type}
                          name={name}
                          value={formData[name] || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={loading}
                          min={min}
                          step={step}
                          placeholder={placeholder}
                          className={`w-full py-3 px-4 bg-white rounded-lg border ${formErrors[name] ? 'border-red-400' : 'border-purple-300'} text-base font-roboto font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition duration-200`}
                          aria-label={label}
                        />
                        {formErrors[name] && (
                          <p className="text-red-500 text-sm mt-2 font-roboto font-medium">
                            {Array.isArray(formErrors[name]) ? formErrors[name].join('; ') : formErrors[name]}
                          </p>
                        )}
                        <span className="absolute hidden group-hover:block bg-purple-600 text-white text-xs rounded px-2 py-1 -top-10 left-0">
                          {placeholder}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-8">
                  <motion.button
                    type="button"
                    onClick={() => navigate('/student/application/page2')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg text-base font-roboto font-semibold hover:bg-gray-600 disabled:bg-gray-300 transition duration-200"
                    aria-label="Go back to previous page"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading || !isFormValid}
                    className={`flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg text-base font-roboto font-semibold ${isFormValid ? 'hover:bg-purple-700' : 'bg-purple-300 cursor-not-allowed'} transition duration-200`}
                    aria-label="Save and proceed to next page"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Save and Next
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </motion.button>
                </div>
              </div>
              {Object.keys(formErrors).length > 0 && (
                <div className="mt-6 p-6 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-800 font-roboto mb-4">Form Errors</div>
                  <ul className="list-disc pl-6 space-y-2">
                    {Object.entries(formErrors).map(([key, errors]) => {
                      // Handle arrays of errors
                      if (Array.isArray(errors)) {
                        return errors.map((error, idx) => (
                          <li key={`${key}_${idx}`} className="text-red-700 font-roboto text-sm font-medium">
                            {typeof error === 'string' ? error : JSON.stringify(error)}
                          </li>
                        ));
                      }
                      // Handle string errors
                      if (typeof errors === 'string') {
                        return (
                          <li key={key} className="text-red-700 font-roboto text-sm font-medium">
                            {errors}
                          </li>
                        );
                      }
                      // Handle object errors (stringify them)
                      return (
                        <li key={key} className="text-red-700 font-roboto text-sm font-medium">
                          {key}: {JSON.stringify(errors)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
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
                  onClick={scrollToTop}
                  whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(139, 92, 246, 0.6)' }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-purple-600 text-white rounded-full shadow-lg"
                  aria-label="Scroll to top"
                >
                  <ArrowUp className="h-5 w-5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          <style>{`
            .font-montserrat { font-family: 'Montserrat', sans-serif; }
            .font-roboto { font-family: 'Roboto', sans-serif; }
          `}</style>
        </motion.div>
      </ErrorBoundary>
    </form>
  );
};

export default EducationalQualificationPage;






