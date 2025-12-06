import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import StepProgressBar from '../components/StepProgressBar';
import axios from 'axios';
import {
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  HomeIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  PencilIcon,
  PrinterIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Import and configure PDF.js worker directly
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Utility function to handle URLs - now supports local storage paths
const getDirectUrl = (url, isImage = true) => {
  if (!url || typeof url !== 'string') {
    console.warn(`[getDirectUrl] Invalid URL: ${url}`);
    return isImage ? '/default-image.png' : '';
  }

  console.log(`[getDirectUrl] Processing URL: ${url}, isImage: ${isImage}`);

  // Check if it's a local file path (starts with /media/)
  if (url.startsWith('/media/')) {
    const fullUrl = `http://localhost:8000${url}`;
    console.log(`[getDirectUrl] Γ£ô Local file URL: ${fullUrl}`);
    return fullUrl;
  }

  // Legacy: Handle Google Drive URLs (for backwards compatibility)
  if (url.includes('drive.google.com')) {
    const patterns = [
      /\/file\/d\/([^/]+)\/?/,
      /id=([^&]+)/,
      /\/d\/([^/]+)\/?/,
    ];
    let fileId = null;
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }
    if (fileId) {
      const proxyUrl = isImage
        ? `http://localhost:8000/api/proxy-image/${fileId}/`
        : `http://localhost:8000/api/proxy-file/${fileId}/`;
      console.log(`[getDirectUrl] Γ£ô Constructed proxy URL: ${proxyUrl}`);
      return proxyUrl;
    }
    console.error(`[getDirectUrl] Γ£ù Failed to extract file ID from URL: ${url}`);
  }

  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log(`[getDirectUrl] Γ£ô Already full URL: ${url}`);
    return url;
  }

  console.warn(`[getDirectUrl] ΓÜá Unrecognized URL format: ${url}`);
  return isImage ? '/default-image.png' : url;
};

// Function to fetch PDF with authentication and return a blob URL
const fetchPdfFile = async (url, originalUrl) => {
  try {
    console.log(`Fetching PDF from: ${url}`);

    // For local files, we can directly use the URL without creating a blob
    if (url.includes('localhost:8000/media/')) {
      console.log(`Using local file directly: ${url}`);
      return url; // Return the URL directly for local files
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Token ${token}` },
      responseType: 'blob',
    });
    console.log(`Response status: ${response.status}, Content-Type: ${response.headers['content-type']}`);
    if (!response.headers['content-type'].includes('application/pdf')) {
      throw new Error(`Invalid content type received: ${response.headers['content-type']}`);
    }
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    console.log(`PDF Blob URL created: ${blobUrl}`);
    return blobUrl;
  } catch (err) {
    console.error('PDF fetch error:', err.message, err.response ? {
      status: err.response?.status,
      data: err.response?.data,
    } : {});
    if (originalUrl && originalUrl.includes('drive.google.com')) {
      console.log(`Attempting fallback to original URL: ${originalUrl}`);
      try {
        const response = await axios.get(originalUrl, { responseType: 'blob' });
        if (response.headers['content-type'].includes('application/pdf')) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          console.log(`Fallback PDF Blob URL created: ${blobUrl}`);
          return blobUrl;
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch error:', fallbackErr.message);
      }
    }
    throw new Error(err.message || 'Failed to fetch PDF file.');
  }
};

const Preview = () => {
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState({
    logo: true,
    photo: true,
    signature: true,
  });
  const [declarations, setDeclarations] = useState({
    infoCorrect: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalType, setModalType] = useState('image');
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [applicationId, setApplicationId] = useState(localStorage.getItem('application_id') || '');

  const allDeclarationsChecked = Object.values(declarations).every(Boolean);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const headers = { Authorization: `Token ${token}` };
      const [previewResponse, autofillResponse, page3Response] = await Promise.all([
        axios.get('http://localhost:8000/api/application/preview/', { headers }),
        axios.get('http://localhost:8000/api/get-autofill-application/', { headers }),
        axios.get('http://localhost:8000/api/application/page3/', { headers }),
      ]);

      const combinedData = {
        student: previewResponse.data.data?.student || autofillResponse.data.data || {},
        application: {
          ...previewResponse.data.data?.application,
          ...autofillResponse.data.data,
          id: previewResponse.data.data?.application?.id || autofillResponse.data.data?.id || '',
          mode_of_study: autofillResponse.data.data?.mode_of_study || previewResponse.data.data?.application?.mode_of_study || '',
          programme_applied: autofillResponse.data.data?.programme_applied || previewResponse.data.data?.application?.programme_applied || '',
          course: autofillResponse.data.data?.course || previewResponse.data.data?.application?.course || '',
          medium: autofillResponse.data.data?.medium || previewResponse.data.data?.application?.medium || '',
          academic_year: autofillResponse.data.data?.academic_year || previewResponse.data.data?.application?.academic_year || '',
          deb_id: autofillResponse.data.data?.deb_id || '',
          abc_id: autofillResponse.data.data?.abc_id || '',
          name_as_aadhaar: autofillResponse.data.data?.name_as_aadhaar || '',
          aadhaar_no: autofillResponse.data.data?.aadhaar_no || '',
          dob: autofillResponse.data.data?.dob || '',
          gender: autofillResponse.data.data?.gender || '',
          father_name: autofillResponse.data.data?.father_name || '',
          father_occupation: autofillResponse.data.data?.father_occupation || '',
          mother_name: autofillResponse.data.data?.mother_name || '',
          mother_occupation: autofillResponse.data.data?.mother_occupation || '',
          guardian_name: autofillResponse.data.data?.guardian_name || '',
          guardian_occupation: autofillResponse.data.data?.guardian_occupation || '',
          nationality: autofillResponse.data.data?.nationality || '',
          religion: autofillResponse.data.data?.religion || '',
          community: autofillResponse.data.data?.community || '',
          mother_tongue: autofillResponse.data.data?.mother_tongue || '',
          differently_abled: autofillResponse.data.data?.differently_abled || '',
          disability_type: autofillResponse.data.data?.disability_type || '',
          blood_group: autofillResponse.data.data?.blood_group || '',
          access_internet: autofillResponse.data.data?.access_internet || '',
          comm_pincode: autofillResponse.data.data?.comm_pincode || '',
          comm_district: autofillResponse.data.data?.comm_district || '',
          comm_state: autofillResponse.data.data?.comm_state || '',
          comm_country: autofillResponse.data.data?.comm_country || '',
          comm_town: autofillResponse.data.data?.comm_town || '',
          comm_area: autofillResponse.data.data?.comm_area || '',
          same_as_comm: autofillResponse.data.data?.same_as_comm || false,
          perm_pincode: autofillResponse.data.data?.perm_pincode || '',
          perm_district: autofillResponse.data.data?.perm_district || '',
          perm_state: autofillResponse.data.data?.perm_state || '',
          perm_country: autofillResponse.data.data?.perm_country || '',
          perm_town: autofillResponse.data.data?.perm_town || '',
          perm_area: autofillResponse.data.data?.perm_area || '',
        },
        student_details: {
          ...page3Response.data.data,
          qualifications: page3Response.data.data?.qualifications || [],
          semester_marks: page3Response.data.data?.semester_marks || [],
          total_max_marks: page3Response.data.data?.total_max_marks || '',
          total_obtained_marks: page3Response.data.data?.total_obtained_marks || '',
          percentage: page3Response.data.data?.percentage || '',
          cgpa: page3Response.data.data?.cgpa || '',
          overall_grade: page3Response.data.data?.overall_grade || '',
          class_obtained: page3Response.data.data?.class_obtained || '',
          current_designation: page3Response.data.data?.current_designation || '',
          current_institute: page3Response.data.data?.current_institute || '',
          years_experience: page3Response.data.data?.years_experience || '',
          annual_income: page3Response.data.data?.annual_income || '',
          photo_url: getDirectUrl(page3Response.data.data?.photo_url, true) || '/default-image.png',
          signature_url: getDirectUrl(page3Response.data.data?.signature_url, true) || '/default-image.png',
          sslc_marksheet_url: page3Response.data.data?.sslc_marksheet_url || '',
          hsc_marksheet_url: page3Response.data.data?.hsc_marksheet_url || '',
          ug_marksheet_url: page3Response.data.data?.ug_marksheet_url || '',
          semester_marksheet_url: page3Response.data.data?.semester_marksheet_url || '',
          community_certificate_url: page3Response.data.data?.community_certificate_url || '',
          aadhaar_url: page3Response.data.data?.aadhaar_url || '',
          transfer_certificate_url: page3Response.data.data?.transfer_certificate_url || '',
          sslc_marksheet_proxy_url: getDirectUrl(page3Response.data.data?.sslc_marksheet_url, false) || '',
          hsc_marksheet_proxy_url: getDirectUrl(page3Response.data.data?.hsc_marksheet_url, false) || '',
          ug_marksheet_proxy_url: getDirectUrl(page3Response.data.data?.ug_marksheet_url, false) || '',
          semester_marksheet_proxy_url: getDirectUrl(page3Response.data.data?.semester_marksheet_url, false) || '',
          community_certificate_proxy_url: getDirectUrl(page3Response.data.data?.community_certificate_url, false) || '',
          aadhaar_proxy_url: getDirectUrl(page3Response.data.data?.aadhaar_url, false) || '',
          transfer_certificate_proxy_url: getDirectUrl(page3Response.data.data?.transfer_certificate_url, false) || '',
        },
        marksheet_uploads: page3Response.data.data?.qualifications?.map(q => ({
          marksheet_url: getDirectUrl(q.sslc_marksheet_url || q.hsc_marksheet_url || q.ug_marksheet_url, false) || '',
          original_url: q.sslc_marksheet_url || q.hsc_marksheet_url || q.ug_marksheet_url || '',
        })) || [],
      };

      console.log('Processed URLs:', {
        photo_url: combinedData.student_details.photo_url,
        signature_url: combinedData.student_details.signature_url,
        transfer_certificate_proxy_url: combinedData.student_details.transfer_certificate_proxy_url,
        community_certificate_proxy_url: combinedData.student_details.community_certificate_proxy_url,
        aadhaar_proxy_url: combinedData.student_details.aadhaar_proxy_url,
      });

      // Set application_id from response
      if (combinedData.application.id) {
        setApplicationId(combinedData.application.id);
        localStorage.setItem('application_id', combinedData.application.id);
      }

      setPreviewData(combinedData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load application data. Please try again.');
      setLoading(false);
      toast.error('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRetry = () => {
    fetchAllData();
  };

  const handleImageLoad = (key) => {
    setImageLoading((prev) => ({ ...prev, [key]: false }));
    console.log(`Image loaded successfully: ${key}`);
  };

  const handleImageError = (e, key, fallback) => {
    console.error(`Failed to load ${key} image:`, e);
    e.target.src = fallback;
    setImageLoading((prev) => ({ ...prev, [key]: false }));
    toast.error(`Failed to load ${key}. Using placeholder image.`);
  };

  const handlePrint = useReactToPrint({
    content: () => {
      console.log('Attempting to print, printRef:', printRef.current);
      if (!printRef.current) {
        console.error('Print reference is null');
        toast.error('Unable to print: Content not found.');
        return null;
      }
      return printRef.current;
    },
    documentTitle: 'Periyar_University_Application',
    onBeforeGetContent: () => {
      console.log('Preparing print content...');
      return new Promise((resolve) => {
        if (loading) {
          toast.error('Please wait for data to load before printing.');
          resolve();
        } else if (error) {
          toast.error('Please resolve errors before printing.');
          resolve();
        } else {
          console.log('Content ready for printing');
          resolve();
        }
      });
    },
    onAfterPrint: () => {
      console.log('Print dialog closed');
      toast.success('Print initiated successfully!');
    },
    onPrintError: (errorLocation, error) => {
      console.error('Print error at', errorLocation, ':', error);
      toast.error('Failed to initiate print. Please try again.');
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background-color: #ffffff;
        }
        .no-print-view {
          display: none !important;
        }
        .print-view-only {
          display: block !important;
          font-family: 'Times New Roman', Times, serif;
          color: #000000;
          background: #ffffff;
          width: 100%;
        }
        
        /* Reset any conflicting styles */
        .card { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important;
        }

        /* Print Table Styles */
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2px;
          font-size: 11pt;
        }
        .print-table td, .print-table th {
          border: 1px solid #000000;
          padding: 4px 6px;
          vertical-align: middle;
        }
        .print-table th {
          font-weight: bold;
          text-align: center;
        }
        
        /* Header specific */
        .header-title {
          color: #4B0082; /* Purple-ish */
          font-size: 22pt;
          font-weight: bold;
          text-align: center;
          margin: 0;
          line-height: 1.2;
        }
        .header-sub {
            font-size: 10pt;
            text-align: center;
            font-weight: bold;
            margin: 2px 0;
        }
        .cdoe-title {
            color: #8B008B;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            margin-top: 5px;
        }
        .odl-text {
            color: #FF8C00;
            font-weight: bold;
            text-align: center;
            font-size: 11pt;
            margin-bottom: 5px;
        }
        .form-title {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 2px;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        
        /* Section headers */
        .section-header-box {
          border: 1px solid #000;
          border-bottom: none;
          padding: 5px;
          font-weight: bold;
          font-size: 12pt;
          background-color: #f0f0f0;
        }
        
        /* Photo cell */
        .photo-cell {
            text-align: center;
            vertical-align: middle;
        }
        .student-photo {
            width: 100px;
            height: 120px;
            object-fit: cover;
            border: 1px solid #000;
            margin: 0 auto;
        }
        
        /* Data layout */
        .label-col {
            font-weight: bold;
            width: 30%;
        }
        .separator-col {
            width: 2%;
            text-align: center;
        }
        .value-col {
            width: 68%;
        }
        
        .sno-col {
            width: 5%;
            text-align: center;
        }
        .field-label-col {
            width: 35%;
            font-weight: bold;
        }
        .field-value-col {
            
        }
        
         /* Payment status styling */
        .status-success {
            color: green;
            font-weight: bold;
        }
        
        .signature-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 40px;
        }
        .signature-box {
            text-align: center;
            width: 200px;
        }
        .signature-img {
            max-height: 50px;
            display: block;
            margin: 0 auto;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 5px;
            padding-top: 5px;
            font-weight: bold;
        }
      }
    `,
  });

  const handleFallbackPrint = () => {
    console.log('Using fallback print method');
    if (!printRef.current) {
      console.error('Print reference is null in fallback');
      toast.error('Unable to print: Content not found.');
      return;
    }
    const nonPrintElements = document.querySelectorAll('.no-print');
    nonPrintElements.forEach(el => el.style.display = 'none');
    window.print();
    nonPrintElements.forEach(el => el.style.display = '');
    toast.success('Fallback print initiated!');
  };

  const handlePrintClick = () => {
    console.log('Print button clicked');
    if (loading || error) {
      handlePrint();
    } else {
      handlePrint();
      setTimeout(() => {
        if (!document.hidden) {
          console.warn('No print dialog detected, using fallback');
          handleFallbackPrint();
        }
      }, 1000);
    }
  };

  const handleDeclarationChange = (key) => {
    setDeclarations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openModal = useCallback(async (proxyUrl, type, title, originalUrl) => {
    setModalContent({ proxyUrl, title, originalUrl });
    setModalType(type);
    setPdfError(null);
    setPdfBlobUrl(null);

    if (type === 'pdf') {
      try {
        const blobUrl = await fetchPdfFile(proxyUrl, originalUrl);
        setPdfBlobUrl(blobUrl);
      } catch (err) {
        setPdfError(err.message || 'Failed to load PDF file. Please try downloading the file.');
        toast.error(`Failed to load ${title}. You can still download the file.`);
      }
    }

    setModalOpen(true);
    console.log(`Opening modal for ${title} with proxy URL: ${proxyUrl}, original URL: ${originalUrl}`);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalContent(null);
    setNumPages(null);
    setPdfError(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setPdfError(`Failed to load ${modalContent?.title}: ${error.message}. Please try downloading the file or contact support.`);
    toast.error(`Failed to load ${modalContent?.title}. Download the file instead.`);
  };

  const handleProceedToPayment = () => {
    if (Object.values(declarations).every((val) => val)) {
      navigate('/student/application/payment');
      toast.success('Proceeding to payment...');
    } else {
      toast.error('Please agree to all declarations');
    }
  };

  const { student, application, student_details } = previewData || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-8 relative">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
          body {
            font-family: 'Roboto', sans-serif;
            overflow-x: hidden;
          }
          .card {
            background: #ffffff;
            border: 1px solid #E5E7EB;
            border-radius: 20px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }
          .section-title {
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            position: relative;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.75rem;
            line-height: 2.25rem;
          }
          .section-container {
            border: 2px solid #D1D5DB;
            border-radius: 12px;
            padding: 20px;
          }
          .personal-title {
            color: #3B82F6;
          }
          .application-title-sec {
            color: #10B981;
          }
          .education-title {
            color: #6B46C1;
          }
          .documents-title {
            color: #EC4899;
          }
          .address-title {
            color: #14B8A6;
          }
          .additional-title {
            color: #F59E0B;
          }
          .declaration-title {
            color: #4F46E5;
          }
          .section-icon {
            transition: transform 0.3s ease;
            border-radius: 50%;
            padding: 4px;
            background: rgba(255, 255, 255, 0.8);
          }
          .section-icon:hover {
            transform: scale(1.15);
          }
          .field-label {
            color: #1F2937;
            font-weight: 500;
            font-size: 1.2rem;
            line-height: 1.75rem;
            margin-right: 1.0rem;
            display: inline-block;
          }
          .field-value {
            color: #4B5563;
            font-weight: 400;
            font-size: 1.2rem;
            line-height: 1.75rem;
            display: inline-block;
          }
          .btn-back {
            background: linear-gradient(135deg, #60A5FA, #3B82F6);
            border-radius: 14px;
            color: #ffffff;
            padding: 14px 28px;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
          }
          .btn-back:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4);
            background: linear-gradient(135deg, #3B82F6, #2563EB);
          }
          .btn-edit {
            background: linear-gradient(135deg, #FBBF24, #F59E0B);
            border-radius: 14px;
            color: #ffffff;
            padding: 14px 28px;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
          }
          .btn-edit:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(245, 158, 11, 0.4);
            background: linear-gradient(135deg, #F59E0B, #D97706);
          }
          .btn-print {
            background: linear-gradient(135deg, #10B981, #059669);
            border-radius: 14px;
            color: #ffffff;
            padding: 14px 28px;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
          }
          .btn-print:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(5, 150, 105, 0.4);
            background: linear-gradient(135deg, #059669, #047857);
          }
          .btn-proceed {
            background: linear-gradient(135deg, #EC4899, #DB2777);
            border-radius: 14px;
            color: #ffffff;
            padding: 14px 28px;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 6px 16px rgba(236, 72, 153, 0.3);
          }
          .btn-proceed:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(236, 72, 153, 0.4);
            background: linear-gradient(135deg, #DB2777, #BE185D);
          }
          .btn-disabled {
            background: #E5E7EB;
            cursor: not-allowed;
            box-shadow: none;
            color: #9CA3AF;
          }
          .marksheet-img {
            border-radius: 10px;
            transition: all 0.3s ease;
            border: 1px solid #E5E7EB;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          }
          .marksheet-img:hover {
            transform: scale(1.03);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header-section {
            background: #ffffff;
            border: 1px solid #E5E7EB;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
          }
          .bg-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23E5E7EB" fill-opacity="0.15"%3E%3Cpath d="M0 0h6v6H0zM54 0h6v6h-6zM0 54h6v60h-6zM54 54h6v6h-6zM27 27h6v6h-6z"/%3E%3C/g%3E%3C/svg%3E');
            z-index: -1;
          }
          .custom-checkbox {
            appearance: none;
            width: 24px;
            height: 24px;
            border: 2px solid #3B82F6;
            border-radius: 8px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .custom-checkbox:checked {
            background: #3B82F6;
            border-color: #3B82F6;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.2l-3.5-3.5a1 1 0 00-1.4 1.4l4.2 4.2a1 1 0 001.4 0l8-8a1 1 0 00-1.4-1.4L9 16.2z'/%3E%3C/svg%3E");
            background-size: 16px;
            background-position: center;
            background-repeat: no-repeat;
          }
          .custom-checkbox:hover {
            border-color: #2563EB;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
          }
          .main-title {
            font-family: 'Poppins', sans-serif;
            color: #6B46C1;
            position: relative;
            display: inline-block;
          }
          .main-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 3px;
            border-radius: 2px;
          }
          .sub-title {
            font-family: 'Poppins', sans-serif;
            color: #6B46C1;
            font-weight: 700;
            font-size: 2rem;
            text-align: center;
          }
          .application-title {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 1.9rem;
            text-align: center;
            color: #4B5563;
          }
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .modal-content {
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            position: relative;
          }
          .modal-large {
            max-width: 95%;
            max-height: 95%;
          }
          .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: #EF4444;
            color: #ffffff;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .modal-close:hover {
            transform: scale(1.1);
          }
          .modal-title {
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            font-size: 1.5rem;
            color: #1F2937;
            margin-bottom: 16px;
            text-align: center;
          }
          .modal-body img {
            max-width: 100%;
            height: auto;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
          }
          .modal-large .modal-body img {
            max-width: 600px;
            max-height: 800px;
            width: auto;
            height: auto;
          }
          .modal-body .react-pdf__Page {
            margin: 0 auto;
            max-width: 100%;
          }
          .modal-body .react-pdf__Page canvas {
            max-width: 100%;
            height: auto !important;
          }
          .modal-body {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .modal-download {
            background: linear-gradient(135deg, #10B981, #059669);
            border-radius: 8px;
            color: #ffffff;
            padding: 12px 24px;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .modal-download:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
            background: linear-gradient(135deg, #059669, #047857);
          }
          .pdf-error {
            color: #EF4444;
            font-family: 'Poppins', sans-serif;
            font-size: 1.1rem;
            text-align: center;
            margin: 16px 0;
          }
          @media (max-width: 640px) {
            .field-label, .field-value {
              font-size: 1.1rem;
              width: 100%;
              display: block;
              line-height: 1.5rem;
            }
            .section-title {
              font-size: 1.5rem;
              line-height: 2rem;
            }
            .btn-back, .btn-edit, .btn-print, .btn-proceed {
              padding: 12px 24px;
              font-size: 1rem;
            }
            .header-section {
              flex-direction: column;
              align-items: center;
              gap: 16px;
              padding: 16px;
            }
            .print-logo, .print-photo, .print-signature {
              width: 80px;
            }
            .main-title {
              font-size: 2.25rem;
            }
            .sub-title {
              font-size: 1.5rem;
            }
            .application-title {
              font-size: 2rem;
            }
            .field-label {
              margin-bottom: 0.5rem;
              margin-right: 0;
            }
            .modal-content {
              width: 95%;
              padding: 16px;
            }
            .modal-title {
              font-size: 1.25rem;
            }
            .modal-download {
              padding: 10px 20px;
              font-size: 0.9rem;
            }
            .pdf-error {
              font-size: 1rem;
            }
          }
        `}
      </style>
      <div className="bg-pattern no-print" />
      <Toaster position="top-right" />
      <div className="w-full max-w-8xl mx-auto mb-12 no-print">
        <StepProgressBar
          currentStep="/application/page5"
          className="no-print card border-none rounded-2xl p-6"
        />
        {loading && (
          <div className="flex justify-center items-center mt-8 card p-8 rounded-2xl no-print">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500" />
            <span className="ml-4 text-xl font-medium text-gray-700">Loading application data...</span>
          </div>
        )}
        {error && (
          <div className="flex justify-center items-center mt-8 card p-8 rounded-2xl no-print">
            <span className="text-xl font-medium text-red-600">{error}</span>
            <button
              onClick={handleRetry}
              className="ml-4 btn-back flex items-center space-x-2"
            >
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
      <div
        ref={printRef}
        className="w-full max-w-6xl card rounded-2xl p-8 sm:p-10 print-border"
      >
        <div className="no-print-view">
          <div className="header-section flex justify-between items-center mb-12 flex-col sm:flex-row gap-4">
            {imageLoading.logo && (
              <div className="w-20 h-20 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center no-print">
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            )}
            <img
              src="/Logo.png"
              alt="Periyar University Logo"
              className={`w-20 h-20 sm:w-24 sm:h-24 print-logo object-cover ${imageLoading.logo ? 'hidden' : ''}`}
              onLoad={() => handleImageLoad('logo')}
              onError={(e) => handleImageError(e, 'logo', '/default-image.png')}
            />
            <div className="flex-1 header-text">
              <h1 className="text-2xl sm:text-3xl font-bold main-title">Periyar University</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 leading-relaxed">Salem-636 011, Tamil Nadu, India</p>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">State University - NAAC 'A++' Grade - NIRF Rank 94</p>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">State Public University Rank 40 - SDG Institutions Rank Band: 11-50</p>
              <h2 className="text-lg sm:text-xl font-bold text-purple-700 mt-2">CENTRE FOR DISTANCE AND ONLINE EDUCATION (CDOE)</h2>
              <p className="text-sm sm:text-base text-gray-600">Open and Distance Learning</p>
            </div>
            {student_details?.photo_url && (
              <div className="relative">
                {imageLoading.photo && (
                  <div className="w-24 h-32 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center no-print">
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                )}
                <img
                  src={student_details.photo_url}
                  alt="Student Photo"
                  className={`w-24 h-32 sm:w-28 sm:h-36 print-photo object-cover ${imageLoading.photo ? 'hidden' : ''}`}
                  onLoad={() => handleImageLoad('photo')}
                  onError={(e) => handleImageError(e, 'photo', '/default-image.png')}
                />
              </div>
            )}
          </div>
          <h3 className="application-title mb-8 text-center font-bold text-2xl">Open and Distance Learning Programme (ODL) Admission for the Academic Year {application?.academic_year || '2025-2026'}</h3>

          {/* Application Info Table */}
          <div className="mb-6 border border-gray-300">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300 w-1/2">Application No :</td>
                  <td className="py-2 px-4 text-sm">{application?.id || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Enrollment No :</td>
                  <td className="py-2 px-4 text-sm">{application?.enrollment_no || student?.enrollment_no || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Applied Date :</td>
                  <td className="py-2 px-4 text-sm">{application?.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">LSC :</td>
                  <td className="py-2 px-4 text-sm">CDOE - Centre for Distance and Online Education (LCZ101)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Program Details Table */}
          <div className="mb-6 border border-gray-300">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300 w-48">1.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Programme Applied</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.programme_applied || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300"></td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Course</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.course || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">2.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Medium</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.medium || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">3.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Name of the Applicant</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm font-medium">{student?.name || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">4.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Date of Birth</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.dob || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300" rowSpan="2">5.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">(a) Name of the Father & Mother</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.father_name || 'N/A'} - {application?.mother_name || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">(b) Name of the Guardian</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.guardian_name || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">6.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Father's & Mother's Occupation</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.father_occupation || 'N/A'} - {application?.mother_occupation || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">7.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Gender</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.gender || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">8.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Mother Tongue</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.mother_tongue || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">9.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Nationality</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.nationality || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">10.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Religion</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.religion || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">11.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Community</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.community || 'N/A'} <button className="text-blue-600 text-xs underline ml-2 no-print" onClick={() => application?.community_certificate_url && window.open(application.community_certificate_url, '_blank')}>View</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Address Section */}
          <div className="mb-6">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="py-2 px-4 text-sm font-bold text-left border-r border-gray-300">12. Communication Address</th>
                  <th className="py-2 px-4 text-sm font-bold text-left">Permanent Address</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4 text-sm align-top border-r border-gray-300">{application?.communication_address || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm align-top">{application?.permanent_address || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Contact Details */}
          <div className="mb-6 border border-gray-300">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300 w-48">13.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Mobile No. / Telephone No.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{student?.phone || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">14.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">E-mail ID</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{student?.email || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300" rowSpan="3">15.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">(a) Aadhaar Card No. & Aadhaar Name</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.aadhaar_no || 'N/A'} <button className="text-blue-600 text-xs underline ml-2 no-print" onClick={() => application?.aadhaar_card_url && window.open(application.aadhaar_card_url, '_blank')}>View</button> {application?.name_as_aadhaar || ''}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">(b) ABC ID</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.abc_id || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">(c) DEB ID</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.deb_id || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">16.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Differently Abled</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.differently_abled || 'No'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">17.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Blood Group</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.blood_group || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">18.</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">Access to Internet</td>
                  <td className="py-2 px-4 font-semibold text-sm bg-gray-50 border-r border-gray-300">:</td>
                  <td className="py-2 px-4 text-sm">{application?.access_internet || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Educational Qualifications Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 bg-gray-50 py-2 px-4 border border-gray-300">19. Education Qualification</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Course</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Institution</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Board</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Subject Studied</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Register No</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Percentage</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Month of Passing</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Year of Passing</th>
                    <th className="py-2 px-3 text-xs font-bold border-r border-gray-300">Mode of Study</th>
                    <th className="py-2 px-3 text-xs font-bold">Document</th>
                  </tr>
                </thead>
                <tbody>
                  {student_details?.qualifications?.length > 0 ? (
                    student_details.qualifications.map((qual, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.course || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.institute_name || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.board || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.subject_studied || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.reg_no || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.percentage || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.month_year?.split('-')[0] || qual.month_year?.split('/')[0] || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.month_year?.split('-')[1] || qual.month_year?.split('/')[1] || qual.year_of_passing || 'N/A'}</td>
                        <td className="py-2 px-3 text-xs border-r border-gray-300">{qual.mode_of_study || 'Regular'}</td>
                        <td className="py-2 px-3 text-xs text-center">
                          <button className="text-blue-600 text-xs underline no-print" onClick={() => qual.marksheet_url && window.open(qual.marksheet_url, '_blank')}>View</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="py-3 px-3 text-xs text-center text-gray-500">No qualifications provided</td>
                    </tr>
                  )}
            {student_details?.semester_marks?.length > 0 && (
              <div className="mt-8">
                <h4 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">Semester Marks</h4>
                {student_details.semester_marks.map((semester, index) => (
                  <div key={index} className="mt-6 border-t border-gray-200 pt-6">
                    <p className="font-semibold text-xl text-gray-800 leading-7">Semester: {semester.semester || 'N/A'}</p>
                    {semester.subjects?.map((subject, subIndex) => (
                      <div key={subIndex} className="grid grid-cols-1 sm:grid-cols-2 gap-8 ml-4 mt-4">
                        <div>
                          <span className="field-label">Subject:</span>
                          <span className="field-value">{subject.subject_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="field-label">Category:</span>
                          <span className="field-value">{subject.category || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="field-label">Max Marks:</span>
                          <span className="field-value">{subject.max_marks || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="field-label">Obtained Marks:</span>
                          <span className="field-value">{subject.obtained_marks || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="field-label">Month/Year:</span>
                          <span className="field-value">{subject.month_year || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
              <div>
                <span className="field-label">Total Max Marks:</span>
                <span className="field-value">{student_details?.total_max_marks || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Total Obtained Marks:</span>
                <span className="field-value">{student_details?.total_obtained_marks || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Percentage:</span>
                <span className="field-value">{student_details?.percentage || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">CGPA:</span>
                <span className="field-value">{student_details?.cgpa || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Overall Grade:</span>
                <span className="field-value">{student_details?.overall_grade || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Class Obtained:</span>
                <span className="field-value">{student_details?.class_obtained || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Current Designation:</span>
                <span className="field-value">{student_details?.current_designation || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Current Institute:</span>
                <span className="field-value">{student_details?.current_institute || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Years of Experience:</span>
                <span className="field-value">{student_details?.years_experience || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Annual Income:</span>
                <span className="field-value">{student_details?.annual_income || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mb-12 card section-container bg-gradient-to-br from-pink-50/70 to-pink-100/70 p-8 sm:p-10">
            <div className="flex items-center space-x-4 mb-6">
              <DocumentTextIcon className="h-7 w-7 text-pink-600 section-icon no-print" />
              <h3 className="section-title documents-title">Uploaded Documents</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {student_details?.sslc_marksheet_proxy_url && (
                <div>
                  <span className="field-label">SSLC Marksheet:</span>
                  <div className="field-value">
                    <button
                      onClick={() => openModal(student_details.sslc_marksheet_proxy_url, 'pdf', 'SSLC Marksheet', student_details.sslc_marksheet_url)}
                      className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                    >
                      View SSLC Marksheet
                    </button>
                    <span className="document-attached"></span>
                  </div>
                </div>
              )}
              {student_details?.hsc_marksheet_proxy_url && (
                <div>
                  <span className="field-label">HSC Marksheet:</span>
                  <div className="field-value">
                    <button
                      onClick={() => openModal(student_details.hsc_marksheet_proxy_url, 'pdf', 'HSC Marksheet', student_details.hsc_marksheet_url)}
                      className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                    >
                      View HSC Marksheet
                    </button>
                    <span className="document-attached"></span>
                  </div>
                </div>
              )}
              {student_details?.ug_marksheet_proxy_url && (
                <div>
                  <span className="field-label">UG Marksheet:</span>
                  <div className="field-value">
                    <button
                      onClick={() => openModal(student_details.ug_marksheet_proxy_url, 'pdf', 'UG Marksheet', student_details.ug_marksheet_url)}
                      className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                    >
                      View UG Marksheet
                    </button>
                    <span className="document-attached"></span>
                  </div>
                </div>
              )}
              {student_details?.semester_marksheet_proxy_url && (
                <div>
                  <span className="field-label">Semester Marksheet:</span>
                  <div className="field-value">
                    <button
                      onClick={() => openModal(student_details.semester_marksheet_proxy_url, 'pdf', 'Semester Marksheet', student_details.semester_marksheet_url)}
                      className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                    >
                      View Semester Marksheet
                    </button>
                    <span className="document-attached"></span>
                  </div>
                </div>
              )}
              {student_details?.community_certificate_proxy_url && (
                <div>
                  <span className="field-label">Community Certificate:</span>
                  <div className="field-value">
                    <button
                      onClick={() => openModal(student_details.community_certificate_proxy_url, 'pdf', 'Community Certificate', student_details.community_certificate_url)}
                      className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                    >
                      View Community Certificate
                    </button>
                    <span className="document-attached"></span>
                  </div>
                </div>
              )}
              {student_details?.aadhaar_proxy_url && (
                <div>
                  <span className="field-label">Aadhaar Card:</span>
                  <div className="field-value">
                    <button
                      onClick={() => openModal(student_details.aadhaar_proxy_url, 'pdf', 'Aadhaar Card', student_details.aadhaar_url)}
                      className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                    >
                      View Aadhaar Card
                    </button>
                    <span className="document-attached"></span>
                  </div>
                </div>
              )}
              {student_details?.transfer_certificate_proxy_url && (
                <div>
                  <span className="field-label">Transfer Certificate:</span>
                  <div className="field-value">
                    <button
                      onClick={() => openModal(student_details.transfer_certificate_proxy_url, 'pdf', 'Transfer Certificate', student_details.transfer_certificate_url)}
                      className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                    >
                      View Transfer Certificate
                    </button>
                    <span className="document-attached"></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-12 card section-container bg-gradient-to-br from-teal-50/70 to-teal-100/70 p-8 sm:p-10">
            <div className="flex items-center space-x-4 mb-6">
              <HomeIcon className="h-7 w-7 text-teal-600 section-icon no-print" />
              <h3 className="section-title address-title">Address Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <span className="field-label">Communication Town:</span>
                <span className="field-value">{application?.comm_town || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Communication District:</span>
                <span className="field-value">{application?.comm_district || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Communication State:</span>
                <span className="field-value">{application?.comm_state || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Communication Country:</span>
                <span className="field-value">{application?.comm_country || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Communication Pincode:</span>
                <span className="field-value">{application?.comm_pincode || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Communication Area:</span>
                <span className="field-value">{application?.comm_area || 'N/A'}</span>
              </div>
              {application?.same_as_comm ? (
                <div className="col-span-2">
                  <span className="field-label">Permanent Address:</span>
                  <span className="field-value">Same as Communication Address</span>
                </div>
              ) : (
                <>
                  <div>
                    <span className="field-label">Permanent Town:</span>
                    <span className="field-value">{application?.perm_town || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="field-label">Permanent District:</span>
                    <span className="field-value">{application?.perm_district || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="field-label">Permanent State:</span>
                    <span className="field-value">{application?.perm_state || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="field-label">Permanent Country:</span>
                    <span className="field-value">{application?.perm_country || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="field-label">Permanent Pincode:</span>
                    <span className="field-value">{application?.perm_pincode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="field-label">Permanent Area:</span>
                    <span className="field-value">{application?.perm_area || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mb-12 card section-container bg-gradient-to-br from-yellow-50/70 to-yellow-100/70 p-8 sm:p-10">
            <div className="flex items-center space-x-4 mb-6">
              <InformationCircleIcon className="h-7 w-7 text-yellow-600 section-icon no-print" />
              <h3 className="section-title additional-title">Additional Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <span className="field-label">Differently Abled:</span>
                <span className="field-value">{application?.differently_abled || 'N/A'}</span>
              </div>
              {application?.differently_abled === 'Yes' && (
                <div>
                  <span className="field-label">Disability Type:</span>
                  <span className="field-value">{application?.disability_type || 'N/A'}</span>
                </div>
              )}
              <div>
                <span className="field-label">Blood Group:</span>
                <span className="field-value">{application?.blood_group || 'N/A'}</span>
              </div>
              <div>
                <span className="field-label">Access to Internet:</span>
                <span className="field-value">{application?.access_internet || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mb-12 card section-container bg-gradient-to-br from-indigo-50/70 to-indigo-100/70 p-8 sm:p-10 no-print">
            <div className="flex items-center space-x-4 mb-6">
              <h3 className="section-title declaration-title">Declaration</h3>
            </div>
            <div className="p-3">
              <p className="text-base text-gray-600 leading-5 mb-6">
                By submitting this application, you confirm that all provided information is accurate and complete. Any false or misleading information may result in the rejection of your application or cancellation of admission. Please review all details carefully before proceeding.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={declarations.infoCorrect}
                    className="custom-checkbox"
                    id="infoCorrect"
                    onChange={() => handleDeclarationChange('infoCorrect')}
                  />
                  <label htmlFor="infoCorrect" className="text-sm text-gray-600 leading-7">
                    I confirm that all information provided in this application is true and correct to the best of my knowledge.
                  </label>
                </div>
              </div>
              {student_details?.signature_url && (
                <div className="flex justify-end mt-8">
                  <div className="text-center">
                    {imageLoading.signature && (
                      <div className="w-32 h-16 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Loading...</span>
                      </div>
                    )}
                    <img
                      src={student_details.signature_url}
                      alt="Signature"
                      className={`border border-gray-300 rounded-lg max-w-32 max-h-16 print-signature ${imageLoading.signature ? 'hidden' : ''}`}
                      onLoad={() => handleImageLoad('signature')}
                      onError={(e) => handleImageError(e, 'signature', '/default-image.png')}
                    />
                    <p className="text-xs text-gray-500 mt-2">Applicant's Signature</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-between gap-6 no-print">
            <button
              onClick={() => navigate('/student/application/page4')}
              className="btn-back flex items-center space-x-2"
              title="Go back to previous page"
            >
              <ArrowLeftIcon className="h-6 w-6" />
              <span>Back</span>
            </button>
            <div className="flex flex-wrap gap-6">
              <button
                onClick={() => navigate('/student/application/page1')}
                className="btn-edit flex items-center space-x-2"
                title="Edit application details"
              >
                <PencilIcon className="h-6 w-6" />
                <span>Edit</span>
              </button>
              <button
                onClick={handlePrintClick}
                className="btn-print flex items-center space-x-2"
                title="Print application form"
              >
                <PrinterIcon className="h-6 w-6" />
                <span>Print</span>
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={!allDeclarationsChecked}
                className={`flex items-center space-x-2 transition-all duration-300 ${allDeclarationsChecked ? 'btn-proceed' : 'btn-disabled'}`}
                title={allDeclarationsChecked ? 'Proceed to payment' : 'Please check all declarations'}
              >
                <CreditCardIcon className="h-6 w-6" />
                <span>Proceed to Payment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Professional Print Layout */}
        <div className="print-view-only hidden">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginBottom: '10px' }}>
              <span>{new Date().toLocaleDateString()}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>Application Form - {applicationId}</span>
              <span style={{ fontWeight: 'bold' }}>PUCDOE</span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src="/Logo.png" alt="Periyar University" style={{ width: '80px', height: 'auto', marginBottom: '10px' }} />
              <h1 className="header-title">Periyar University</h1>
              <p className="header-sub">State University - NAAC 'A++' Grade - NIRF Rank 94</p>
              <p className="header-sub">State Public University Rank 40 - SDG Institutions Rank Band: 11-50</p>
              <p className="header-sub">Salem-636011, Tamilnadu, India.</p>

              <h2 className="cdoe-title">CENTRE FOR DISTANCE AND ONLINE EDUCATION (CDOE)</h2>
              <div className="odl-text">Open and Distance Learning</div>
              <div style={{ borderBottom: '2px solid black', margin: '5px auto', width: '100%' }}></div>
              <h3 className="form-title">Open and Distance Learning Programme (ODL) Admission for the Academic Year {application?.academic_year || '2025-2026'}</h3>
            </div>

            <table className="print-table">
              <tbody>
                <tr>
                  <td className="field-label-col">Application No :</td>
                  <td className="field-value-col">{applicationId}</td>
                  <td rowSpan="4" className="photo-cell" style={{ width: '150px' }}>
                    {student_details?.photo_url ? (
                      <img src={student_details.photo_url} alt="Student" className="student-photo" />
                    ) : (
                      <div className="student-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Photo</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="field-label-col">Enrollment No :</td>
                  <td className="field-value-col">N/A</td>
                </tr>
                <tr>
                  <td className="field-label-col">Applied Date :</td>
                  <td className="field-value-col">{new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td className="field-label-col">LSC :</td>
                  <td className="field-value-col">CDOE-CENTRE FOR DISTANCE AND ONLINE EDUCATION</td>
                </tr>
              </tbody>
            </table>

            <table className="print-table">
              <colgroup>
                <col className="sno-col" />
                <col className="field-label-col" />
                <col className="separator-col" />
                <col className="field-value-col" />
              </colgroup>
              <tbody>
                <tr>
                  <td>1.</td>
                  <td>Programme Applied</td>
                  <td>:</td>
                  <td>{application?.programme_applied}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Course</td>
                  <td>:</td>
                  <td>{application?.course}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Medium</td>
                  <td>:</td>
                  <td>{application?.medium}</td>
                </tr>
                <tr>
                  <td>2.</td>
                  <td>Name of the Applicant</td>
                  <td>:</td>
                  <td>{student?.name}</td>
                </tr>
                <tr>
                  <td>3.</td>
                  <td>Date of Birth</td>
                  <td>:</td>
                  <td>{application?.dob}</td>
                </tr>
                <tr>
                  <td>4.</td>
                  <td>(a) Name of the Father & Mother</td>
                  <td>:</td>
                  <td>{application?.father_name} & {application?.mother_name}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>(b) Name of the Guardian</td>
                  <td>:</td>
                  <td>{application?.guardian_name}</td>
                </tr>
                <tr>
                  <td>5.</td>
                  <td>Father's & Mother's Occupation</td>
                  <td>:</td>
                  <td>{application?.father_occupation} &  {application?.mother_occupation}</td>
                </tr>
                <tr>
                  <td>6.</td>
                  <td>Gender</td>
                  <td>:</td>
                  <td>{application?.gender}</td>
                </tr>
                <tr>
                  <td>7.</td>
                  <td>Mother Tongue</td>
                  <td>:</td>
                  <td>{application?.mother_tongue}</td>
                </tr>
                <tr>
                  <td>8.</td>
                  <td>Nationality</td>
                  <td>:</td>
                  <td>{application?.nationality}</td>
                </tr>
                <tr>
                  <td>9.</td>
                  <td>Religion</td>
                  <td>:</td>
                  <td>{application?.religion}</td>
                </tr>
                <tr>
                  <td>10.</td>
                  <td>Community</td>
                  <td>:</td>
                  <td>{application?.community}</td>
                </tr>
              </tbody>
            </table>

            <div className="section-header-box" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>11. Communication Address</span>
              <span>Permanent Address</span>
            </div>

            <table className="print-table" style={{ marginTop: 0 }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', height: '80px', verticalAlign: 'top' }}>
                    {application?.comm_town}, {application?.comm_district}, <br />
                    {application?.comm_state}, {application?.comm_country} - {application?.comm_pincode}<br />
                    Area: {application?.comm_area}
                  </td>
                  <td style={{ width: '50%', height: '80px', verticalAlign: 'top' }}>
                    {application?.perm_town}, {application?.perm_district}, <br />
                    {application?.perm_state}, {application?.perm_country} - {application?.perm_pincode}<br />
                    Area: {application?.perm_area}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="print-table">
              <colgroup>
                <col className="sno-col" />
                <col className="field-label-col" />
                <col className="separator-col" />
                <col className="field-value-col" />
              </colgroup>
              <tbody>
                <tr>
                  <td>12.</td>
                  <td>Mobile No. / Telephone No.</td>
                  <td>:</td>
                  <td>{student?.phone}</td>
                </tr>
                <tr>
                  <td>13.</td>
                  <td>E-mail ID</td>
                  <td>:</td>
                  <td>{student?.email}</td>
                </tr>
                <tr>
                  <td>14.</td>
                  <td>(a)AADHAAR No</td>
                  <td>:</td>
                  <td>{application?.aadhaar_no}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>(b)ABC ID</td>
                  <td>:</td>
                  <td>{application?.abc_id}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>(c)DEB ID</td>
                  <td>:</td>
                  <td>{application?.deb_id}</td>
                </tr>
                <tr>
                  <td>15.</td>
                  <td>Differently Abled</td>
                  <td>:</td>
                  <td>{application?.differently_abled}</td>
                </tr>
                <tr>
                  <td>16.</td>
                  <td>Blood Group</td>
                  <td>:</td>
                  <td>{application?.blood_group}</td>
                </tr>
                <tr>
                  <td>17.</td>
                  <td>Access to Internet</td>
                  <td>:</td>
                  <td>{application?.access_internet}</td>
                </tr>
              </tbody>
            </table>

            <div className="section-header-box">
              18. Education Qualification
            </div>
            <table className="print-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Institution</th>
                  <th>Board</th>
                  <th>Subject Studied</th>
                  <th>Register No</th>
                  <th>Percent age</th>
                  <th>Month of Passing</th>
                  <th>Year of Passing</th>
                  <th>Mode of Study</th>
                  <th>Document</th>
                </tr>
              </thead>
              <tbody>
                {student_details?.qualifications?.length > 0 ? (
                  student_details.qualifications.map((q, i) => (
                    <tr key={i}>
                      <td>{q.course}</td>
                      <td>{q.institute_name}</td>
                      <td>{q.board}</td>
                      <td>{q.subject_studied}</td>
                      <td>{q.reg_no}</td>
                      <td>{q.percentage}</td>
                      <td>{q.month_year?.split('/')[0]}</td>
                      <td>{q.month_year?.split('/')[1]}</td>
                      <td>{q.mode_of_study}</td>
                      <td>-</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="10" style={{ textAlign: 'center' }}>No qualifications found</td></tr>
                )}
              </tbody>
            </table>

            <div className="section-header-box">
              19. Working Experience
            </div>
            <table className="print-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Current Designation</th>
                  <th>Current Working Institution</th>
                  <th>Working Experience in Years</th>
                  <th>Annual Income in Rs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ minHeight: '30px' }}>{student_details?.current_designation}</td>
                  <td>{student_details?.current_institute}</td>
                  <td>{student_details?.years_experience}</td>
                  <td>{student_details?.annual_income}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '14pt', textAlign: 'center', margin: '20px 0 10px 0' }}>
              Payment Status
            </div>
            <table className="print-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Order ID</td>
                  <td>PUCDOE{Date.now()}</td>
                  <td style={{ fontWeight: 'bold' }}>Amount</td>
                  <td>Γé╣ 236.00</td>
                  <td style={{ fontWeight: 'bold' }}>Status</td>
                  <td className="status-success">TXN_SUCCESS</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Bank Name</td>
                  <td></td>
                  <td style={{ fontWeight: 'bold' }}>Payment Mode</td>
                  <td>UPI</td>
                  <td style={{ fontWeight: 'bold' }}>Transaction Date & Time</td>
                  <td>
                    {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="signature-section">
              <div className="signature-box">
                {student_details?.signature_url && (
                  <img src={student_details.signature_url} alt="Signature" className="signature-img" />
                )}
                <div className="signature-line">
                  Student Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && modalContent && (
        <div className="modal-overlay no-print">
          <div className={`modal-content ${modalType === 'image' && (modalContent.title === 'Photo' || modalContent.title === 'Signature') ? 'modal-large' : ''}`}>
            <button className="modal-close" onClick={closeModal}>
              Γ£ò
            </button>
            <h3 className="modal-title">{modalContent.title}</h3>
            <div className="modal-body">
              {modalType === 'image' ? (
                <img
                  src={modalContent.proxyUrl}
                  alt={modalContent.title}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.src = '/default-image.png';
                    toast.error(`Failed to load ${modalContent.title}.`);
                  }}
                />
              ) : (
                <>
                  {pdfError ? (
                    <p className="pdf-error">
                      {pdfError}
                    </p>
                  ) : (
                    pdfBlobUrl ? (
                      <Document
                        file={pdfBlobUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={<div className="animate-pulse text-gray-600">Loading PDF...</div>}
                        error={<div className="pdf-error">Failed to load PDF. Please try downloading the file.</div>}
                      >
                        {numPages &&
                          Array.from(new Array(numPages), (el, index) => (
                            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                          ))}
                      </Document>
                    ) : (
                      <div className="animate-pulse text-gray-600">Fetching PDF...</div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;