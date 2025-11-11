import { useCallback, useState, lazy, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { BookOpen, Building, FileText, Calendar, Percent, Globe, Upload, Eye } from 'lucide-react';

const DocumentPreviewModal = lazy(() => import('./DocumentPreviewModal'));

const MarksheetUpload = ({ index, onFileChange, marksheetUrl, uploadProgress, errors, setErrors, qualificationType }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF files are allowed');
      setErrors((prev) => ({ ...prev, [index]: { ...prev[index], marksheet: 'Only PDF files are allowed' } }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit');
      setErrors((prev) => ({ ...prev, [index]: { ...prev[index], marksheet: 'File size exceeds 2MB limit' } }));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('qualification_type', qualificationType);
    formData.append('email', localStorage.getItem('userEmail') || '');

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:8000/api/upload-marksheet/', formData, {
          headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onFileChange(index, { uploadUrl: '', uploadProgress: percentCompleted });
          },
        });
        if (res.data.status === 'success') {
          toast.success(`${qualificationType} uploaded successfully!`);
          const urlField = qualificationType === 'S.S.L.C' ? 'sslc_marksheet_url' : qualificationType === 'HSC' ? 'hsc_marksheet_url' : 'ug_marksheet_url';
          onFileChange(index, { uploadUrl: res.data.file_url || '', uploadProgress: 0, urlField });
          setErrors((prev) => ({ ...prev, [index]: { ...prev[index], marksheet: '' } }));
          return;
        } else {
          toast.error(res.data.message || 'Failed to upload file');
          onFileChange(index, { uploadUrl: '', uploadProgress: 0 });
          setErrors((prev) => ({ ...prev, [index]: { ...prev[index], marksheet: res.data.message || 'Upload failed' } }));
          return;
        }
      } catch (err) {
        attempt++;
        if (attempt === maxRetries) {
          toast.error('Error uploading file: ' + (err.response?.data?.message || err.message));
          onFileChange(index, { uploadUrl: '', uploadProgress: 0 });
          setErrors((prev) => ({ ...prev, [index]: { ...prev[index], marksheet: err.response?.data?.message || 'Upload error' } }));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  };

  return (
    <>
      <div className="relative mt-4">
        <label className="block text-lg font-bold text-gray-800 font-roboto mb-2">
          Upload {qualificationType} {qualificationType === 'UG Provisional' ? 'Certificate' : 'Marksheet'} <span className="text-red-500">*</span>
        </label>
        <div className="relative border-2 border-dashed border-purple-300 rounded-lg p-6 bg-white hover:border-purple-400 transition duration-200">
          <input
            type="file"
            id={`marksheet-${index}`}
            onChange={handleFileChange}
            accept=".pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Upload ${qualificationType} ${qualificationType === 'UG Provisional' ? 'certificate' : 'marksheet'}`}
          />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 text-purple-500 mb-2" />
            <p className="text-gray-600 font-roboto text-base font-semibold">
              Drag and drop your {qualificationType} {qualificationType === 'UG Provisional' ? 'certificate' : 'marksheet'} PDF or <span className="text-purple-600 font-bold">click to upload</span>
            </p>
            <p className="text-gray-400 text-sm mt-2 font-semibold">PDF only (max 2MB)</p>
            {uploadProgress > 0 && (
              <div className="w-full mt-3">
                <div className="bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-purple-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-purple-600 text-sm mt-1 font-medium">{uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>
        {errors?.[index]?.marksheet && <p className="text-red-500 text-sm mt-2 font-roboto font-medium">{errors[index].marksheet}</p>}
        {marksheetUrl && (
          <motion.button
            type="button"
            onClick={() => setPreviewOpen(true)}
            whileHover={{ scale: 1.05, boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: [1, 1.02, 1], transition: { duration: 1.5, repeat: Infinity } }}
            disabled={uploadProgress > 0}
            className="mt-3 flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg font-roboto font-medium text-base shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label={`Preview ${qualificationType} ${qualificationType === 'UG Provisional' ? 'certificate' : 'marksheet'}`}
          >
            <Eye className="h-5 w-5 mr-2" />
            Preview {qualificationType === 'UG Provisional' ? 'Certificate' : 'Marksheet'}
          </motion.button>
        )}
      </div>
      <Suspense fallback={<div className="text-gray-600 font-roboto text-base font-medium">Loading preview...</div>}>
        <DocumentPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          documentUrl={marksheetUrl}
          documentType="application/pdf"
        />
      </Suspense>
    </>
  );
};

const EducationalQualificationForm = memo(({ index, qualification, onChange, errors = {}, setErrors, handleMarksheetChange }) => {
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    // Direct update without debounce for immediate typing response
    onChange(index, { ...qualification, [name]: value });
    setErrors((prev) => ({ ...prev, [index]: { ...prev[index] || {}, [name]: '' } }));
  }, [index, qualification, onChange, setErrors]);

  const handleSelectChange = useCallback((selectedOption, { name }) => {
    const updatedQual = { ...qualification, [name]: selectedOption ? selectedOption.value : '' };
    onChange(index, updatedQual);
    setErrors((prev) => ({ ...prev, [index]: { ...prev[index] || {}, [name]: '' } }));
  }, [index, qualification, onChange, setErrors]);

  const handleDateChange = useCallback((date) => {
    if (date) {
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      onChange(index, { ...qualification, month_year: formattedDate });
      setErrors((prev) => ({ ...prev, [index]: { ...prev[index] || {}, month_year: '' } }));
    } else {
      onChange(index, { ...qualification, month_year: '' });
    }
  }, [index, qualification, onChange, setErrors]);

  const parseDate = (dateString) => {
    if (!dateString || !/^\d{2}\/\d{4}$/.test(dateString)) return null;
    const [month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1);
    return isNaN(date.getTime()) ? null : date;
  };

  const selectOptions = {
    mode_of_study: [
      { value: '', label: 'Select Mode of Study' },
      { value: 'Regular', label: 'Regular' },
      { value: 'Distance', label: 'Distance' },
      { value: 'Online', label: 'Online' },
    ],
    course: [
      { value: '', label: 'Select Course' },
      { value: 'Diploma', label: 'Diploma' },
      { value: 'UG', label: 'UG' },
      { value: 'OTHERS', label: 'Others' },
    ],
    board: [
      { value: '', label: 'Select Board' },
      { value: 'State Board', label: 'State Board' },
      { value: 'CBSE', label: 'CBSE' },
      { value: 'ICSE', label: 'ICSE' },
    ],
    university: [
      { value: '', label: 'Select University' },
      { value: 'Anna University', label: 'Anna University' },
      { value: 'University of Madras', label: 'University of Madras' },
      { value: 'Bharathiar University', label: 'Bharathiar University' },
      { value: 'Other', label: 'Other' },
    ],
  };

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      color: '#1f2937',
      transition: 'all 0.2s ease',
      '&:hover': { borderColor: '#8b5cf6', boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)' },
      '&:focus': { borderColor: '#8b5cf6', boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)' },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      border: '1px solid rgba(139, 92, 246, 0.3)',
    }),
    option: (provided, state) => ({
      ...provided,
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      color: state.isSelected ? '#ffffff' : '#1f2937',
      backgroundColor: state.isSelected ? '#8b5cf6' : state.isFocused ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
      '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
    }),
    singleValue: (provided) => ({ ...provided, color: '#1f2937' }),
    placeholder: (provided) => ({ ...provided, color: 'rgba(75, 85, 99, 0.5)' }),
  };

  const customDatePickerStyles = {
  '.react-datepicker': {
    fontFamily: 'Roboto, sans-serif',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '0.75rem',
    backgroundColor: '#ffffff',
    width: '280px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
    animation: 'fadeIn 0.3s ease-in-out',
  },
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'scale(0.97)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  '.react-datepicker__header': {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    borderBottom: 'none',
    padding: '1rem',
    borderTopLeftRadius: '0.75rem',
    borderTopRightRadius: '0.75rem',
  },
  '.react-datepicker__current-month': {
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: '0.25rem',
  },
  '.react-datepicker__navigation': {
    top: '1rem',
  },
  '.react-datepicker__navigation-icon::before': {
    borderColor: '#ffffff',
  },

  /* Month Picker */
  '.react-datepicker__month': {
    margin: '0.79rem 2rem',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  '.react-datepicker__month-text': {
    flex: '0 0 100%',
    padding: '0.6rem 0',
    margin: '0.75rem 2rem',
    fontWeight: 600,
    color: '#1f2937',
    borderRadius: '0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: '#f9fafb',

    '&:hover': {
      backgroundColor: '#8b5cf6',
      color: '#ffffff',
    },
  },
  '.react-datepicker__month--selected, .react-datepicker__month--in-selecting-range, .react-datepicker__month--in-range': {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    borderRadius: '0.5rem',
  },
  '.react-datepicker__month--disabled': {
    color: '#ff4f4',
    cursor: 'not-allowed',
    backgroundColor: 'transparent',

    '&:hover': {
      backgroundColor: 'transparent',
      color: '#d1d5db',
    },
  },

  /* Year Picker */
  '.react-datepicker__year': {
    margin: '0.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  '.react-datepicker__year-text': {
    flex: '0 0 28%',
    padding: '0.75rem 0',
    textAlign: 'center',
    borderRadius: '0.5rem',
    fontWeight: 600,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    cursor: 'pointer',
    transition: '0.2s ease-in-out',

    '&:hover': {
      backgroundColor: '#8b5cf6',
      color: '#ffffff',
    },
  },
  '.react-datepicker__year-text--selected, .react-datepicker__year-text--in-selecting-range, .react-datepicker__year-text--in-range': {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
  },
  '.react-datepicker__year-text--disabled': {
    color: '#d1d5db',
    cursor: 'not-allowed',

    '&:hover': {
      backgroundColor: 'transparent',
      color: '#d1d5db',
    },
  },
};

  const isStatic = ['S.S.L.C', 'HSC'].includes(qualification.course);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 mb-6"
    >
     
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-bold font-roboto text-purple-700">{isStatic ? qualification.course : 'Additional Qualification'}</h4>
      </div>
           <style jsx>{`
              .box{
                outline:'none';
              }
          `}</style>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { name: 'course', label: 'Course', type: isStatic ? 'text' : 'select', icon: BookOpen, placeholder: 'Enter course name', tooltip: 'Select or enter your course' },
          { name: 'institute_name', label: 'Institute Name', type: 'text', icon: Building, placeholder: 'Enter institute name', tooltip: 'Name of the institution' },
          { name: isStatic ? 'board' : 'university', label: isStatic ? 'Board' : 'University', type: 'select', icon: FileText, placeholder: isStatic ? 'Select board' : 'Select university', tooltip: isStatic ? 'Select State or Central board' : 'Select your university' },
          { name: 'subject_studied', label: 'Subjects Studied', type: 'text', icon: BookOpen, placeholder: 'Enter subjects studied', tooltip: 'List of subjects studied' },
          { name: 'reg_no', label: 'Register Number', type: 'text', icon: FileText, placeholder: 'Enter register number', tooltip: 'Your register or roll number' },
          { name: 'percentage', label: 'Percentage', type: 'number', icon: Percent, min: 0, max: 100, step: 0.01, placeholder: 'Enter percentage', tooltip: 'Enter percentage (0-100)' },
        ].map(({ name, label, type, icon: Icon, min, max, step, placeholder, tooltip }) => (
          <div key={name} className="relative group">
            <label className="block text-base font-medium text-gray-800 font-roboto mb-2">
              {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
              {type === 'select' ? (
                <Select
                  name={name}
                  value={selectOptions[name].find((opt) => opt.value === qualification[name]) || { value: '', label: `Select ${name === 'board' ? 'Board' : name === 'university' ? 'University' : 'Course'}` }}
                  onChange={handleSelectChange}
                  options={selectOptions[name]}
                  styles={customSelectStyles}
                  className="font-roboto pl-10"
                  classNamePrefix="select"
                  aria-label={label}
                />
              ) : (
                <input
                  type={type}
                  name={name}
                  value={qualification[name] || ''}
                  onChange={handleInputChange}
                  disabled={name === 'course' && isStatic}
                  min={min}
                  max={max}
                  step={step}
                  placeholder={placeholder}
                  className={`w-full py-4  pl-10 pr-3 bg-white  rounded-lg  box border border-purple-300 text-base font-roboto font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition duration-200 ${name === 'course' && isStatic ? 'cursor-not-allowed bg-gray-100' : ''}`}
                  aria-label={label}
                />
              )}
              <span className="absolute hidden group-hover:block bg-purple-600 text-white text-xs rounded px-2 py-1 -top-10 left-0">
                {tooltip}
              </span>
            </div>
            {errors?.[index]?.[name] && (
              <p className="text-red-500 text-sm mt-2 font-roboto font-medium">{errors[index][name]}</p>
            )}
          </div>
        ))}
        <div className="relative group">
          <label className="block text-lg font-bold text-gray-800 font-roboto mb-2">
            Month & Year <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
            <DatePicker
              selected={parseDate(qualification.month_year)}
              onChange={handleDateChange}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              showFullMonthYearPicker
              placeholderText="Select Month & Year"
              className="w-full py-4 pl-10 pr-3 bg-white rounded-lg border border-purple-300 text-base font-roboto font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition duration-200"
              aria-label="Month & Year"
              minDate={new Date(1900, 0, 1)}
              maxDate={new Date()}
            />
            <span className="absolute hidden group-hover:block bg-purple-600 text-white text-xs rounded px-2 py-1 -top-10 left-0">
              Select month and year
            </span>
            {errors?.[index]?.month_year && (
              <p className="text-red-500 text-sm mt-2 font-roboto font-medium">{errors[index].month_year}</p>
            )}
          </div>
        </div>
        <div className="relative group">
          <label className="block text-lg font-bold text-gray-800 font-roboto mb-2">
            Mode of Study <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
            <Select
              name="mode_of_study"
              value={selectOptions.mode_of_study.find((opt) => opt.value === qualification.mode_of_study) || { value: '', label: 'Select Mode of Study' }}
              onChange={handleSelectChange}
              options={selectOptions.mode_of_study}
              styles={customSelectStyles}
              className="font-roboto pl-10"
              classNamePrefix="select"
              aria-label="Mode of Study"
            />
            <span className="absolute hidden group-hover:block bg-purple-600 text-white text-xs rounded px-2 py-1 -top-10 left-0">
              Select mode of study (e.g., Regular, Distance)
            </span>
            {errors?.[index]?.mode_of_study && (
              <p className="text-red-500 text-sm mt-2 font-roboto font-medium">{errors[index].mode_of_study}</p>
            )}
          </div>
        </div>
      </div>
      <MarksheetUpload
        index={index}
        onFileChange={handleMarksheetChange}
        marksheetUrl={qualification[`${qualification.course === 'S.S.L.C' ? 'sslc' : qualification.course === 'HSC' ? 'hsc' : 'ug'}_marksheet_url`] || ''}
        uploadProgress={qualification.uploadProgress || 0}
        errors={errors}
        setErrors={setErrors}
        qualificationType={qualification.course === 'S.S.L.C' ? 'S.S.L.C' : qualification.course === 'HSC' ? 'HSC' : 'UG Provisional'}
      />
      <style jsx>{`
        ${Object.entries(customDatePickerStyles)
          .map(([key, styles]) => {
            const styleString = Object.entries(styles)
              .map(([prop, value]) => {
                const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
                return `${cssProp}: ${value};`;
              })
              .join(' ');
            return `${key} { ${styleString} }`;
          })
          .join('\n')}
      `}</style>
    </motion.div>
  );
});

// Add display name for debugging
EducationalQualificationForm.displayName = 'EducationalQualificationForm';

const QualificationsAndSemesters = ({ formData, setFormData, loading, errors }) => {
  const [localErrors, setLocalErrors] = useState({});

  if (!formData || typeof formData !== 'object' || !Array.isArray(formData.qualifications)) {
    console.error('Invalid formData in QualificationsAndSemesters:', formData);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow-lg text-center">
          <h2 className="text-3xl font-bold text-red-600 font-montserrat">Error: Invalid Data</h2>
          <p className="mt-3 text-gray-600 text-base font-medium font-roboto">The application data could not be loaded. Please try refreshing or contact support.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium font-roboto transition duration-200">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleQualificationChange = useCallback(
    (index, updatedQualification) => {
      setFormData((prev) => ({
        ...prev,
        qualifications: prev.qualifications.map((qual, i) => (i === index ? updatedQualification : qual)),
      }));
    },
    [setFormData]
  );

  const handleMarksheetChange = (index, { uploadUrl, uploadProgress, urlField }) => {
    setFormData(prev => {
      const newQualifications = [...prev.qualifications];
      newQualifications[index] = {
        ...newQualifications[index],
        [urlField]: uploadUrl,
        uploadProgress,
      };
      return { ...prev, qualifications: newQualifications };
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-2xl font-bold font-montserrat text-purple-700 mb-6">
          Educational Qualifications
        </h3>
        {formData.qualifications.map((qualification, index) => (
          <EducationalQualificationForm
            key={`qual-${index}`}
            index={index}
            qualification={qualification}
            onChange={handleQualificationChange}
            errors={localErrors}
            setErrors={setLocalErrors}
            handleMarksheetChange={handleMarksheetChange}
          />
        ))}
      </div>
    </div>
  );
};

export default QualificationsAndSemesters;