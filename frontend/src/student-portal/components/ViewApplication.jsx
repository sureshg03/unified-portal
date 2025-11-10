import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import {
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  HomeIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Utility function to handle URLs
const getDirectGoogleDriveUrl = (url, isImage = true) => {
  if (!url || typeof url !== 'string') {
    console.warn(`Invalid URL: ${url}`);
    return isImage ? '/default-image.png' : '';
  }
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
      console.log(`Constructed proxy URL: ${proxyUrl}`);
      return proxyUrl;
    }
    console.error(`Failed to extract file ID from URL: ${url}`);
  }
  console.warn(`Unrecognized URL format: ${url}`);
  return isImage ? '/default-image.png' : url;
};

// Function to fetch PDF with authentication and return a blob URL
const fetchPdfFile = async (url, originalUrl) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found.');
    }
    console.log(`Fetching PDF from proxy: ${url}`);
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

const ViewApplication = () => {
  const navigate = useNavigate();
  const { '*': id } = useParams(); // Get application ID from URL
  const printRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState({
    logo: true,
    photo: true,
    signature: true,
  });
  const [declarations] = useState({
    infoCorrect: true,
    documentsAuthentic: true,
    universityRules: true,
    dataProcessing: true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalType, setModalType] = useState('image');
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [applicationId, setApplicationId] = useState(id);

  console.log('Extracted Application ID:', id);

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
        axios.get(`http://localhost:8000/api/application/preview/?application_id=${id}`, { headers }),
        axios.get(`http://localhost:8000/api/get-autofill-application/?application_id=${id}`, { headers }),
        axios.get(`http://localhost:8000/api/application/page3/?application_id=${id}`, { headers }),
      ]);

      const combinedData = {
        student: previewResponse.data.data?.student || autofillResponse.data.data || {},
        application: {
          ...previewResponse.data.data?.application,
          ...autofillResponse.data.data,
          id: previewResponse.data.data?.application?.id || autofillResponse.data.data?.id || id,
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
          photo_url: getDirectGoogleDriveUrl(page3Response.data.data?.photo_url, true) || '/default-image.png',
          signature_url: getDirectGoogleDriveUrl(page3Response.data.data?.signature_url, true) || '/default-image.png',
          sslc_marksheet_url: page3Response.data.data?.sslc_marksheet_url || '',
          hsc_marksheet_url: page3Response.data.data?.hsc_marksheet_url || '',
          ug_marksheet_url: page3Response.data.data?.ug_marksheet_url || '',
          semester_marksheet_url: page3Response.data.data?.semester_marksheet_url || '',
          community_certificate_url: page3Response.data.data?.community_certificate_url || '',
          aadhaar_url: page3Response.data.data?.aadhaar_url || '',
          transfer_certificate_url: page3Response.data.data?.transfer_certificate_url || '',
          sslc_marksheet_proxy_url: getDirectGoogleDriveUrl(page3Response.data.data?.sslc_marksheet_url, false) || '',
          hsc_marksheet_proxy_url: getDirectGoogleDriveUrl(page3Response.data.data?.hsc_marksheet_url, false) || '',
          ug_marksheet_proxy_url: getDirectGoogleDriveUrl(page3Response.data.data?.ug_marksheet_url, false) || '',
          semester_marksheet_proxy_url: getDirectGoogleDriveUrl(page3Response.data.data?.semester_marksheet_url, false) || '',
          community_certificate_proxy_url: getDirectGoogleDriveUrl(page3Response.data.data?.community_certificate_url, false) || '',
          aadhaar_proxy_url: getDirectGoogleDriveUrl(page3Response.data.data?.aadhaar_url, false) || '',
          transfer_certificate_proxy_url: getDirectGoogleDriveUrl(page3Response.data.data?.transfer_certificate_url, false) || '',
        },
        marksheet_uploads: page3Response.data.data?.qualifications?.map(q => ({
          marksheet_url: getDirectGoogleDriveUrl(q.sslc_marksheet_url || q.hsc_marksheet_url || q.ug_marksheet_url, false) || '',
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
  }, [id]);

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
          font-family: 'Times New Roman', Times, serif;
          color: #000000;
          margin: 0;
          background: #FFFFFF;
        }
        .no-print {
          display: none !important;
        }
        .print-border {
          border: 2px solid #000000;
          padding: 20px;
          box-shadow: none;
          background: #FFFFFF;
        }
        .print-logo {
          width: 80px;
          height: auto;
          object-fit: contain;
          border: 1px solid #000000;
        }
        .print-photo, .print-signature {
          width: 90px;
          height: 120px;
          object-fit: cover;
          border: 1px solid #000000;
        }
        .section-container {
          border: 1px solid #000000;
          padding: 15px;
          margin-bottom: 15px;
          page-break-inside: avoid;
          background: #FFFFFF;
        }
        .section-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #000000;
          text-align: left;
          color: #000000;
        }
        .field-label {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          font-weight: bold;
          width: 40%;
          display: inline-block;
          vertical-align: top;
          padding-right: 10px;
        }
        .field-value {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          width: 55%;
          display: inline-block;
          border-bottom: 1px solid #000000;
        }
        .marksheet-img {
          max-width: 120px;
          height: auto;
          margin: 8px 0;
          border: 1px solid #000000;
        }
        .main-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 20pt;
          font-weight: bold;
          color: #000000;
          text-align: center;
          margin-bottom: 10px;
        }
        .sub-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
        }
        .application-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 18pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000000;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #000000;
          padding-bottom: 10px;
        }
        .header-text {
          text-align: left;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        .grid {
          margin: 0;
        }
        .card {
          box-shadow: none;
          border: none;
          background: none;
        }
        .document-link {
          display: none;
        }
        .document-attached::after {
          content: 'Attached';
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          color: #000000;
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

  const handleBack = () => {
    navigate('/student/dashboard');
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
            background: #3B82F6;
            cursor: default;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.2l-3.5-3.5a1 1 0 00-1.4 1.4l4.2 4.2a1 1 0 001.4 0l8-8a1 1 0 00-1.4-1.4L9 16.2z'/%3E%3C/svg%3E");
            background-size: 16px;
            background-position: center;
            background-repeat: no-repeat;
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
            .btn-back, .btn-print {
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
      <div className="w-full max-w-7xl mx-auto mb-8 no-print">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
          <button
            onClick={handleBack}
            className="btn-back flex items-center space-x-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Applications</span>
          </button>
          <button
            onClick={handlePrintClick}
            className="btn-print flex items-center space-x-2"
          >
            <PrinterIcon className="h-5 w-5" />
            <span>Print Application</span>
          </button>
        </div>
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
        <div className="header-section flex justify-between items-start mb-12 flex-col sm:flex-row gap-8">
          <div className="flex items-center space-x-8 header-text">
            {imageLoading.logo && (
              <div className="w-24 h-24 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center no-print">
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            )}
            <img
              src="/Logo.png"
              alt="Periyar University Logo"
              className={`w-24 h-24 print-logo rounded-xl object-cover border border-gray-200 ${imageLoading.logo ? 'hidden' : ''}`}
              onLoad={() => handleImageLoad('logo')}
              onError={(e) => handleImageError(e, 'logo', '/default-image.png')}
            />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold main-title">Periyar University</h1>
              <p className="text-lg sm:text-xl text-gray-600 mt-3 leading-7">Salem-636 011, Tamil Nadu, India</p>
              <p className="text-base sm:text-lg text-gray-500 leading-6">NAAC with 'A++' Grade | NIRF Rank 56 | State Public University Rank 25</p>
            </div>
          </div>
          {student_details?.photo_url && (
            <div className="relative">
              {imageLoading.photo && (
                <div className="w-28 h-36 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center no-print">
                  <span className="text-gray-400 text-sm">Loading...</span>
                </div>
              )}
              <img
                src={student_details.photo_url}
                alt="Student Photo"
                className={`w-28 h-36 print-photo rounded-xl object-cover border border-gray-200 ${imageLoading.photo ? 'hidden' : ''}`}
                onLoad={() => handleImageLoad('photo')}
                onError={(e) => handleImageError(e, 'photo', '/default-image.png')}
              />
            </div>
          )}
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold sub-title mb-6">Centre for Distance and Online Education - CDOE</h2>
        <h3 className="application-title mb-12">Application for Admission</h3>

        <div className="mb-12 card section-container bg-gradient-to-br from-blue-50/70 to-blue-100/70 p-8 sm:p-10">
          <div className="flex items-center space-x-4 mb-8">
            <UserIcon className="h-7 w-7 text-blue-600 section-icon no-print" />
            <h3 className="section-title personal-title">Personal Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <span className="field-label">Name:</span>
              <span className="field-value">{student?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Email:</span>
              <span className="field-value">{student?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Phone:</span>
              <span className="field-value">{student?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Name as per Aadhaar:</span>
              <span className="field-value">{application?.name_as_aadhaar || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Aadhaar Number:</span>
              <span className="field-value">{application?.aadhaar_no || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Date of Birth:</span>
              <span className="field-value">{application?.dob || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Gender:</span>
              <span className="field-value">{application?.gender || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Father's Name:</span>
              <span className="field-value">{application?.father_name || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Father's Occupation:</span>
              <span className="field-value">{application?.father_occupation || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Mother's Name:</span>
              <span className="field-value">{application?.mother_name || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Mother's Occupation:</span>
              <span className="field-value">{application?.mother_occupation || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Guardian:</span>
              <span className="field-value">{application?.guardian_name || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Guardian's Occupation:</span>
              <span className="field-value">{application?.guardian_occupation || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Nationality:</span>
              <span className="field-value">{application?.nationality || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Religion:</span>
              <span className="field-value">{application?.religion || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Community:</span>
              <span className="field-value">{application?.community || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Mother Tongue:</span>
              <span className="field-value">{application?.mother_tongue || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="mb-12 card section-container bg-gradient-to-br from-green-50/70 to-green-100/70 p-8 sm:p-10">
          <div className="flex items-center space-x-4 mb-6">
            <AcademicCapIcon className="h-7 w-7 text-green-600 section-icon no-print" />
            <h3 className="section-title application-title-sec">Application Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <span className="field-label">Mode of Study:</span>
              <span className="field-value">{application?.mode_of_study || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Program Applied:</span>
              <span className="field-value">{application?.programme_applied || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Course:</span>
              <span className="field-value">{application?.course || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Medium:</span>
              <span className="field-value">{application?.medium || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Academic Year:</span>
              <span className="field-value">{application?.academic_year || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">DEB ID:</span>
              <span className="field-value">{application?.deb_id || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">ABC ID:</span>
              <span className="field-value">{application?.abc_id || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="mb-12 card section-container bg-gradient-to-br from-purple-50/70 to-purple-100/70 p-8 sm:p-10">
          <div className="flex items-center space-x-4 mb-6">
            <AcademicCapIcon className="h-7 w-7 text-purple-600 section-icon no-print" />
            <h3 className="section-title education-title">Educational Qualifications</h3>
          </div>
          {student_details?.qualifications?.length > 0 ? (
            student_details.qualifications.map((qual, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-gray-200 pb-6 mb-6">
                <div>
                  <span className="field-label">Course:</span>
                  <span className="field-value">{qual.course || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Institute:</span>
                  <span className="field-value">{qual.institute_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Board:</span>
                  <span className="field-value">{qual.board || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Subjects Studied:</span>
                  <span className="field-value">{qual.subject_studied || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Register Number:</span>
                  <span className="field-value">{qual.reg_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Percentage:</span>
                  <span className="field-value">{qual.percentage || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Month/Year:</span>
                  <span className="field-value">{qual.month_year || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Mode of Study:</span>
                  <span className="field-value">{qual.mode_of_study || 'N/A'}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-lg leading-7">No qualifications provided.</p>
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
            {student_details?.photo_url && (
              <div>
                <span className="field-label">Photo:</span>
                <div className="field-value">
                  <button
                    onClick={() => openModal(student_details.photo_url, 'image', 'Photo', student_details.photo_url)}
                    className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                  >
                    View Photo
                  </button>
                  <span className="document-attached"></span>
                  {imageLoading.photo && (
                    <div className="w-32 h-32 bg-gray-100 animate-pulse mt-4 rounded-xl flex items-center justify-center no-print">
                      <span className="text-gray-400 text-sm">Loading...</span>
                    </div>
                  )}
                  <img
                    src={student_details.photo_url}
                    alt="Photo"
                    className={`marksheet-img mt-4 border border-gray-200 max-w-32 print-photo ${imageLoading.photo ? 'hidden' : ''}`}
                    onLoad={() => handleImageLoad('photo')}
                    onError={(e) => handleImageError(e, 'photo', '/default-image.png')}
                  />
                </div>
              </div>
            )}
            {student_details?.signature_url && (
              <div>
                <span className="field-label">Signature:</span>
                <div className="field-value">
                  <button
                    onClick={() => openModal(student_details.signature_url, 'image', 'Signature', student_details.signature_url)}
                    className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors duration-300 document-link"
                  >
                    View Signature
                  </button>
                  <span className="document-attached"></span>
                  {imageLoading.signature && (
                    <div className="w-32 h-16 bg-gray-100 animate-pulse mt-4 rounded-xl flex items-center justify-center no-print">
                      <span className="text-gray-400 text-sm">Loading...</span>
                    </div>
                  )}
                  <img
                    src={student_details.signature_url}
                    alt="Signature"
                    className={`marksheet-img mt-4 border border-gray-200 max-w-32 print-signature ${imageLoading.signature ? 'hidden' : ''}`}
                    onLoad={() => handleImageLoad('signature')}
                    onError={(e) => handleImageError(e, 'signature', '/default-image.png')}
                  />
                </div>
              </div>
            )}
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
              <span className="field-label">Communication Area:</span>
              <span className="field-value">{application?.comm_area || 'N/A'}</span>
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
              <span className="field-label">Permanent Town:</span>
              <span className="field-value">{application?.same_as_comm ? application?.comm_town : application?.perm_town || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Permanent Area:</span>
              <span className="field-value">{application?.same_as_comm ? application?.comm_area : application?.perm_area || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Permanent District:</span>
              <span className="field-value">{application?.same_as_comm ? application?.comm_district : application?.perm_district || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Permanent State:</span>
              <span className="field-value">{application?.same_as_comm ? application?.comm_state : application?.perm_state || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Permanent Country:</span>
              <span className="field-value">{application?.same_as_comm ? application?.comm_country : application?.perm_country || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Permanent Pincode:</span>
              <span className="field-value">{application?.same_as_comm ? application?.comm_pincode : application?.perm_pincode || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="mb-12 card section-container bg-gradient-to-br from-yellow-50/70 to-yellow-100/70 p-8 sm:p-10">
          <div className="flex items-center space-x-4 mb-6">
            <InformationCircleIcon className="h-7 w-7 text-yellow-600 section-icon no-print" />
            <h3 className="section-title additional-title">Additional Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <span className="field-label">Differently Abled:</span>
              <span className="field-value">{application?.differently_abled || 'N/A'}</span>
            </div>
            <div>
              <span className="field-label">Disability Type:</span>
              <span className="field-value">{application?.disability_type || 'N/A'}</span>
            </div>
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

        <div className="mb-12 card section-container bg-gradient-to-br from-indigo-50/70 to-indigo-100/70 p-8 sm:p-10">
          <div className="flex items-center space-x-4 mb-6">
            <InformationCircleIcon className="h-7 w-7 text-indigo-600 section-icon no-print" />
            <h3 className="section-title declaration-title">Declaration</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={declarations.infoCorrect}
                readOnly
                className="custom-checkbox"
              />
              <p className="text-lg text-gray-700 leading-7">
                I hereby declare that all the information provided in this application is true and correct to the best of my knowledge.
              </p>
            </div>
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={declarations.documentsAuthentic}
                readOnly
                className="custom-checkbox"
              />
              <p className="text-lg text-gray-700 leading-7">
                I confirm that all the documents uploaded are authentic and belong to me.
              </p>
            </div>
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={declarations.universityRules}
                readOnly
                className="custom-checkbox"
              />
              <p className="text-lg text-gray-700 leading-7">
                I agree to abide by the rules and regulations of Periyar University.
              </p>
            </div>
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={declarations.dataProcessing}
                readOnly
                className="custom-checkbox"
              />
              <p className="text-lg text-gray-700 leading-7">
                I consent to the processing of my personal data for the purpose of this application as per the university's privacy policy.
              </p>
            </div>
          </div>
          {student_details?.signature_url && (
            <div className="mt-8">
              <span className="field-label">Signature:</span>
              <div className="field-value">
                {imageLoading.signature && (
                  <div className="w-32 h-16 bg-gray-100 animate-pulse mt-4 rounded-xl flex items-center justify-center no-print">
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                )}
                <img
                  src={student_details.signature_url}
                  alt="Signature"
                  className={`marksheet-img mt-4 border border-gray-200 max-w-32 print-signature ${imageLoading.signature ? 'hidden' : ''}`}
                  onLoad={() => handleImageLoad('signature')}
                  onError={(e) => handleImageError(e, 'signature', '/default-image.png')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && modalContent && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <button
              onClick={closeModal}
              className="modal-close"
            >
              &times;
            </button>
            <h3 className="modal-title">{modalContent.title}</h3>
            <div className="modal-body">
              {modalType === 'image' ? (
                <img
                  src={modalContent.proxyUrl}
                  alt={modalContent.title}
                  className="modal-body-img"
                  onError={(e) => handleImageError(e, modalContent.title.toLowerCase(), '/default-image.png')}
                />
              ) : (
                <>
                  {pdfError ? (
                    <p className="pdf-error">{pdfError}</p>
                  ) : (
                    pdfBlobUrl && (
                      <Document
                        file={pdfBlobUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                      >
                        {Array.from(new Array(numPages), (el, index) => (
                          <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />
                        ))}
                      </Document>
                    )
                  )}
                  <a
                    href={modalContent.originalUrl}
                    download
                    className="modal-download"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    Download {modalContent.title}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplication;