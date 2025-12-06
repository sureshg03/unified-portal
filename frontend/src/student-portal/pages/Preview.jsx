import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import StepProgressBar from '../components/StepProgressBar';
import axios from 'axios';
import {
  ArrowLeftIcon,
  PencilIcon,
  PrinterIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

// Utility function to handle URLs
const getDirectUrl = (url, isImage = true) => {
  if (!url || typeof url !== 'string') return isImage ? '/default-image.png' : '';
  if (url.startsWith('/media/')) return `http://localhost:8000${url}`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return isImage ? '/default-image.png' : url;
};

const Preview = () => {
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [declarations, setDeclarations] = useState({ infoCorrect: false });
  const [applicationId, setApplicationId] = useState(localStorage.getItem('application_id') || '');
  const [paymentData, setPaymentData] = useState(null);
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const allDeclarationsChecked = Object.values(declarations).every(Boolean);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please log in again.');

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
        },
        student_details: {
          ...page3Response.data.data,
          photo_url: getDirectUrl(page3Response.data.data?.photo_url, true),
          signature_url: getDirectUrl(page3Response.data.data?.signature_url, true),
        },
      };

      if (combinedData.application.id) {
        setApplicationId(combinedData.application.id);
        localStorage.setItem('application_id', combinedData.application.id);
      }

      setPreviewData(combinedData);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load application data.');
      setLoading(false);
      toast.error('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchAcademicYear();
  }, []);

  const fetchAcademicYear = async () => {
    try {
      const res = await axios.get('http://localhost:8000/portal/application-settings/active_academic_year/');
      if (res.data.status === 'success' && res.data.academic_year) {
        setAcademicYear(res.data.academic_year);
      }
    } catch (err) {
      console.error('Error fetching academic year:', err);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Application_${applicationId || 'Preview'}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-only { display: block !important; }
      }
    `,
  });

  const handleDeclarationChange = (key) => {
    setDeclarations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProceedToPayment = () => {
    if (allDeclarationsChecked) {
      navigate('/student/application/payment');
      toast.success('Proceeding to payment...');
    } else {
      toast.error('Please agree to all declarations');
    }
  };

  const { student, application, student_details } = previewData || {};

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700">Loading application data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button onClick={fetchAllData} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Roboto', sans-serif;
          }

          /* Professional Table Styles */
          .preview-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            font-size: 13px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .preview-table td, .preview-table th {
            border: 1px solid #2c2c2c;
            padding: 10px 14px;
            vertical-align: middle;
            line-height: 1.5;
          }

          .preview-table th {
            background: #f5f5f5;
            font-weight: 700;
            text-align: left;
            color: #1a1a1a;
          }

          .sno-col {
            width: 50px;
            text-align: center;
            font-weight: 600;
            color: #1a1a1a;
            background: #fafafa;
          }

          .label-col {
            width: 40%;
            font-weight: 500;
            color: #1a1a1a;
            background: #fafafa;
          }

          .value-col {
            font-weight: 400;
            color: #333;
            background: white;
          }
          
          .app-info-table {
            margin-bottom: 24px;
          }
          
          .app-info-table td {
            padding: 12px 14px;
          }
          
          .app-info-label {
            font-weight: 600;
            color: #1a1a1a;
            background: #f8f8f8;
            width: 160px;
          }
          
          .app-info-value {
            font-weight: 400;
            color: #333;
            background: white;
          }

          .header-row {
            background: #e0e0e0;
            font-weight: 700;
            text-align: center;
            color: #1a1a1a;
          }

          /* Print Styles */
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            
            body {
              font-family: 'Times New Roman', Times, serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-size: 9pt !important;
            }
            
            .preview-table td, .preview-table th {
              font-size: 9pt !important;
              padding: 3px 5px !important;
              border: 1px solid #000 !important;
              line-height: 1.3 !important;
            }
            
            .header-container {
              border-bottom: 2px solid #000 !important;
              margin-bottom: 6px !important;
              padding-bottom: 8px !important;
            }
            
            .header-flex {
              min-height: 120px !important;
              margin-bottom: 6px !important;
              gap: 0px !important;
            }
            
            .logo-img {
              width: 100px !important;
              height: 100px !important;
              filter: none !important;
            }
            
            .university-name {
              font-size: 18pt !important;
              margin: 0 0 2px 0 !important;
            }
            
            .university-sub {
              font-size: 8pt !important;
              margin: 1px 0 !important;
              line-height: 1.2 !important;
            }
            
            .cdoe-title {
              font-size: 12pt !important;
              margin: 5px 0 2px 0 !important;
            }
            
            .odl-text {
              font-size: 10pt !important;
            }
            
            .form-title {
              font-size: 10pt !important;
              margin: 6px 0 !important;
            }
            
            .student-photo {
              border: 2px solid #000 !important;
            }
            
            .student-photo-img {
              width: 85px !important;
              height: 110px !important;
              border: 2px solid #000 !important;
            }
            
            .preview-table {
              margin-bottom: 8px !important;
            }
            
            .app-info-table td {
              padding: 4px 6px !important;
            }
            
            h3 {
              font-size: 10pt !important;
              margin: 8px 0 4px 0 !important;
              padding: 4px 0 !important;
            }
            
            /* Signature section for print */
            .print-signature-section {
              margin-top: 20px !important;
              page-break-inside: avoid;
              padding: 10px 0 !important;
            }
            
            .print-signature-section h3 {
              font-size: 11pt !important;
              margin-bottom: 8px !important;
            }
            
            .print-signature-section p {
              font-size: 9pt !important;
              line-height: 1.4 !important;
              margin-bottom: 10px !important;
            }
            
            .print-signature-box {
              text-align: right;
              margin-right: 30px;
            }
            
            .print-signature-img {
              max-width: 120px !important;
              max-height: 50px !important;
              border: 1px solid #000;
              padding: 3px;
              margin-bottom: 5px;
            }
            
            .print-signature-label {
              font-size: 9pt !important;
              font-weight: bold;
              color: #000;
            }
            
            /* Footer for print */
            .print-footer {
              margin-top: 15px !important;
              padding-top: 8px !important;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 8pt !important;
              page-break-inside: avoid;
            }
            
            .print-footer p {
              margin: 2px 0 !important;
            }
            
            /* Prevent page breaks in tables */
            .preview-table {
              page-break-inside: auto;
            }
            
            .preview-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            /* Force page break before declaration */
            .print-only {
              page-break-before: auto;
            }
          }

          /* Header Styles */
          .header-container {
            text-align: center;
            margin-bottom: 16px;
            border-bottom: 3px solid #1a1a1a;
            padding-bottom: 12px;
          }
          
          .header-flex {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 0px;
            margin-bottom: 8px;
            min-height: 140px;
          }
          
          .logo-section {
            flex: 0 0 120px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            padding: 0;
          }
          
          .logo-img {
            width: 120px;
            height: 120px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
          }
          
          .header-content {
            flex: 1;
            text-align: center;
          }
          
          .photo-section {
            flex: 0 0 120px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 5px;
          }
          
          .student-photo-img {
            width: 100px;
            height: 130px;
            object-fit: cover;
            border: 2px solid #2c2c2c;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .university-name {
            font-size: 28px;
            font-weight: 700;
            color: #8B008B;
            margin: 0 0 6px 0;
            letter-spacing: 0.5px;
            line-height: 1.2;
          }

          .university-sub {
            font-size: 11px;
            color: #2c2c2c;
            margin: 2px 0;
            line-height: 1.5;
          }

          .cdoe-title {
            font-size: 17px;
            font-weight: 700;
            color: #8B008B;
            margin: 10px 0 5px 0;
            letter-spacing: 0.5px;
          }

          .odl-text {
            font-size: 14px;
            font-weight: 600;
            color: #FF8C00;
            margin: 0;
          }

          .form-title {
            font-size: 15px;
            font-weight: 700;
            text-decoration: underline;
            margin: 14px 0;
            color: #1a1a1a;
          }

          /* Photo Cell */
          .photo-cell {
            text-align: center;
            vertical-align: middle;
            padding: 8px;
          }

          .student-photo {
            width: 100px;
            height: 120px;
            object-fit: cover;
            border: 2px solid #333;
          }

          /* Info Box */
          .info-box {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          }

          /* Documents Section */
          .documents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 16px;
          }

          .document-item {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            text-align: center;
            background: #f9f9f9;
          }

          .document-link {
            color: #1d4ed8;
            text-decoration: none;
            font-weight: 500;
          }

          .document-link:hover {
            text-decoration: underline;
          }

          /* Declaration Section */
          .declaration-box {
            background: #f0f7ff;
            border: 2px solid #1d4ed8;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }

          .signature-section {
            text-align: right;
            margin-top: 24px;
          }

          .signature-img {
            max-width: 150px;
            max-height: 60px;
            border: 1px solid #333;
            padding: 4px;
          }

          /* Buttons */
          .action-button {
            padding: 11px 28px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          }

          .btn-back {
            background: #3b82f6;
            color: white;
          }

          .btn-edit {
            background: #f59e0b;
            color: white;
          }

          .btn-print {
            background: #10b981;
            color: white;
          }

          .btn-proceed {
            background: #ec4899;
            color: white;
          }

          .btn-disabled {
            background: #d1d5db;
            color: #6b7280;
            cursor: not-allowed;
            box-shadow: none;
          }

          .action-button:hover:not(.btn-disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }

          /* Colon Column */
          .colon-col {
            width: 30px;
            text-align: center;
            font-weight: 500;
            background: #fafafa;
          }
        `}
      </style>

      <Toaster position="top-right" />

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto mb-6 no-print">
        <StepProgressBar currentStep="/application/page5" />
      </div>

      {/* Main Content */}
      <div ref={printRef} className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-8">

        {/* Header Section */}
        <div className="header-container" style={{ borderBottom: '2px solid #8B008B', paddingBottom: '16px', marginBottom: '20px' }}>
          <div className="header-flex" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-start', paddingLeft: '40px' }}>
            <div className="logo-section" style={{ flex: '0 0 auto' }}>
              <img src="/Logo.png" alt="Periyar University Logo" className="logo-img" style={{ width: '140px', height: '140px', display: 'block' }} />
            </div>
            <div className="header-content" style={{ flex: '1', textAlign: 'left' }}>
              <h1 className="university-name" style={{ fontSize: '32px', margin: '0 0 4px 0', color: '#8B008B', fontWeight: 800, lineHeight: '1.1' }}>Periyar University</h1>
              <p className="university-sub" style={{ fontSize: '11px', fontWeight: 600, margin: '2px 0', color: '#333', lineHeight: '1.3' }}>State University - NAAC 'A++' Grade - NIRF Rank 94</p>
              <p className="university-sub" style={{ fontSize: '11px', margin: '2px 0', color: '#444', lineHeight: '1.3' }}>State Public University Rank 40 - SDG Institutions Rank Band: 11-50</p>
              <p className="university-sub" style={{ fontSize: '11px', fontWeight: 600, margin: '2px 0 8px 0', color: '#333', lineHeight: '1.3' }}>Salem-636011, Tamilnadu, India</p>
              <h2 className="cdoe-title" style={{ fontSize: '18px', fontWeight: 800, color: '#FF8C00', margin: '6px 0 3px 0', lineHeight: '1.2' }}>CENTRE FOR DISTANCE AND ONLINE EDUCATION (CDOE)</h2>
              <p className="odl-text" style={{ fontSize: '14px', fontWeight: 700, color: '#FF8C00', margin: '0', lineHeight: '1.2' }}>Open and Distance Learning</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 className="form-title" style={{ fontSize: '15px', fontWeight: 700, textAlign: 'center', margin: '0 0 8px 0', textDecoration: 'underline', color: '#1a1a1a' }}>
            Open and Distance Learning Programme (ODL) Admission for the Academic Year {application?.academic_year || academicYear}
          </h3>
        </div>

        {/* Application Info Table */}
        <table className="preview-table app-info-table" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td className="app-info-label" style={{ width: '140px' }}>Application No :</td>
              <td className="app-info-value" style={{ width: 'auto' }}>{applicationId || 'PU/ODL/LC2101/A25/0229'}</td>
              <td rowSpan="4" style={{ width: '120px', textAlign: 'center', verticalAlign: 'middle', padding: '8px', border: '2px solid #2c2c2c' }}>
                {student_details?.photo_url && (
                  <img
                    src={student_details.photo_url}
                    alt="Student Photo"
                    style={{ width: '100px', height: '130px', objectFit: 'cover', border: '2px solid #2c2c2c' }}
                  />
                )}
              </td>
            </tr>
            <tr>
              <td className="app-info-label">Enrollment No :</td>
              <td className="app-info-value">N/A</td>
            </tr>
            <tr>
              <td className="app-info-label">Applied Date :</td>
              <td className="app-info-value">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}</td>
            </tr>
            <tr>
              <td className="app-info-label">LSC :</td>
              <td className="app-info-value">CDOE - Centre for Distance and Online Education (LC2101)</td>
            </tr>
          </tbody>
        </table>

        {/* Programme Applied Table */}
        <table className="preview-table">
          <tbody>
            <tr>
              <td className="sno-col">1.</td>
              <td className="label-col">Programme Applied</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.programme_applied || application?.program_type || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col"></td>
              <td className="label-col">Course</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.course || application?.course_name || application?.selected_course || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col"></td>
              <td className="label-col">Medium</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.medium || application?.medium_of_instruction || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">2.</td>
              <td className="label-col">Name of the Applicant</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{student?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">3.</td>
              <td className="label-col">Date of Birth</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.dob || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">4.</td>
              <td className="label-col">(a) Name of the Father & Mother</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.father_name || 'N/A'} - {application?.mother_name || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col"></td>
              <td className="label-col">(b) Name of the Guardian</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.guardian_name || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">5.</td>
              <td className="label-col">Father's & Mother's Occupation</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.father_occupation || 'N/A'} - {application?.mother_occupation || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">6.</td>
              <td className="label-col">Gender</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.gender || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">7.</td>
              <td className="label-col">Mother Tongue</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.mother_tongue || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">8.</td>
              <td className="label-col">Nationality</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.nationality || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">9.</td>
              <td className="label-col">Religion</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.religion || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">10.</td>
              <td className="label-col">Community</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.community || 'N/A'}
                {application?.community_view && (
                  <a href={application.community_view} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-2 underline text-sm">View</a>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Address Table */}
        <table className="preview-table">
          <thead>
            <tr className="header-row">
              <th colSpan="4">11. Communication Address</th>
              <th colSpan="4">Permanent Address</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" style={{ padding: '12px' }}>
                {application?.comm_area && <div>{application.comm_area},</div>}
                {application?.comm_town && <div>{application.comm_town},</div>}
                {application?.comm_district && <div>{application.comm_district},</div>}
                {application?.comm_state && <div>{application.comm_state} - {application.comm_pincode || ''}</div>}
                {application?.comm_country && <div>{application.comm_country}</div>}
              </td>
              <td colSpan="4" style={{ padding: '12px' }}>
                {application?.perm_area && <div>{application.perm_area},</div>}
                {application?.perm_town && <div>{application.perm_town},</div>}
                {application?.perm_district && <div>{application.perm_district},</div>}
                {application?.perm_state && <div>{application.perm_state} - {application.perm_pincode || ''}</div>}
                {application?.perm_country && <div>{application.perm_country}</div>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Additional Details Table */}
        <table className="preview-table">
          <tbody>
            <tr>
              <td className="sno-col">12.</td>
              <td className="label-col">Mobile No. / Telephone No.</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{student?.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">13.</td>
              <td className="label-col">E-mail ID</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{student?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">14.</td>
              <td className="label-col">(a)Aadhaar Card No. & Aadhaar Name</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.aadhaar_no || 'N/A'}
                {application?.aadhaar_view && (
                  <a href={application.aadhaar_view} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-2 underline text-sm">View</a>
                )}
                <span className="ml-4">{application?.name_as_aadhaar || ''}</span>
              </td>
            </tr>
            <tr>
              <td className="sno-col"></td>
              <td className="label-col">(b)ABC ID</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.abc_id || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col"></td>
              <td className="label-col">(c)DEB ID</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.deb_id || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">15.</td>
              <td className="label-col">Differently Abled</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.differently_abled || 'No'}</td>
            </tr>
            <tr>
              <td className="sno-col">16.</td>
              <td className="label-col">Blood Group</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.blood_group || 'N/A'}</td>
            </tr>
            <tr>
              <td className="sno-col">17.</td>
              <td className="label-col">Access to Internet</td>
              <td className="text-center" style={{ padding: '8px', fontWeight: 500 }}>:</td>
              <td className="value-col">{application?.access_internet || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        {/* Educational Qualifications */}
        {student_details?.qualifications && student_details.qualifications.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-bold mb-3 text-gray-900" style={{ padding: '12px 0 8px 0' }}>18. Education Qualification</h3>
            <table className="preview-table">
              <thead>
                <tr className="header-row">
                  <th style={{ width: '120px' }}>Course</th>
                  <th>Institution</th>
                  <th>Board</th>
                  <th>Subject Studied</th>
                  <th style={{ width: '100px' }}>Register No</th>
                  <th style={{ width: '90px' }}>Percentage</th>
                  <th style={{ width: '80px' }}>Month of Passing</th>
                  <th style={{ width: '80px' }}>Year of Passing</th>
                  <th style={{ width: '90px' }}>Mode of Study</th>
                </tr>
              </thead>
              <tbody>
                {student_details.qualifications.map((qual, index) => (
                  <tr key={index}>
                    <td>{qual.course || 'N/A'}</td>
                    <td>{qual.institute_name || 'N/A'}</td>
                    <td>{qual.board || 'N/A'}</td>
                    <td>{qual.subject_studied || 'N/A'}</td>
                    <td>{qual.reg_no || 'N/A'}</td>
                    <td className="text-center">{qual.percentage || 'N/A'}%</td>
                    <td className="text-center">{qual.month_year?.split(' ')[0] || 'N/A'}</td>
                    <td className="text-center">{qual.month_year?.split(' ')[1] || qual.year_of_passing || 'N/A'}</td>
                    <td className="text-center">{qual.mode_of_study || 'Regular'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Working Experience Table */}
        <div className="mb-6">
          <h3 className="text-base font-bold mb-3 text-gray-900" style={{ padding: '12px 0 8px 0' }}>19. Working Experience</h3>
          <table className="preview-table">
            <thead>
              <tr className="header-row">
                <th>Current Designation</th>
                <th>Current Working Institution</th>
                <th>Working Experience in Years</th>
                <th>Annual Income in Rs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="value-col text-center">{student_details?.current_designation || '-'}</td>
                <td className="value-col text-center">{student_details?.current_institute || '-'}</td>
                <td className="value-col text-center">{student_details?.years_experience || '-'}</td>
                <td className="value-col text-center">{student_details?.annual_income || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>



        {/* Documents Section (No Print) */}
        <div className="no-print mb-6">
          <div className="info-box">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Uploaded Documents</h3>
            <div className="documents-grid">
              {student_details?.sslc_marksheet_url && (
                <div className="document-item">
                  <p className="font-semibold mb-2">SSLC Marksheet</p>
                  <a href={getDirectUrl(student_details.sslc_marksheet_url, false)} target="_blank" rel="noopener noreferrer" className="document-link">
                    View Document
                  </a>
                </div>
              )}
              {student_details?.hsc_marksheet_url && (
                <div className="document-item">
                  <p className="font-semibold mb-2">HSC Marksheet</p>
                  <a href={getDirectUrl(student_details.hsc_marksheet_url, false)} target="_blank" rel="noopener noreferrer" className="document-link">
                    View Document
                  </a>
                </div>
              )}
              {student_details?.ug_marksheet_url && (
                <div className="document-item">
                  <p className="font-semibold mb-2">UG Marksheet</p>
                  <a href={getDirectUrl(student_details.ug_marksheet_url, false)} target="_blank" rel="noopener noreferrer" className="document-link">
                    View Document
                  </a>
                </div>
              )}
              {student_details?.community_certificate_url && (
                <div className="document-item">
                  <p className="font-semibold mb-2">Community Certificate</p>
                  <a href={getDirectUrl(student_details.community_certificate_url, false)} target="_blank" rel="noopener noreferrer" className="document-link">
                    View Document
                  </a>
                </div>
              )}
              {student_details?.aadhaar_url && (
                <div className="document-item">
                  <p className="font-semibold mb-2">Aadhaar Card</p>
                  <a href={getDirectUrl(student_details.aadhaar_url, false)} target="_blank" rel="noopener noreferrer" className="document-link">
                    View Document
                  </a>
                </div>
              )}
              {student_details?.transfer_certificate_url && (
                <div className="document-item">
                  <p className="font-semibold mb-2">Transfer Certificate</p>
                  <a href={getDirectUrl(student_details.transfer_certificate_url, false)} target="_blank" rel="noopener noreferrer" className="document-link">
                    View Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Declaration Section (No Print) */}
        <div className="no-print declaration-box">
          <h3 className="text-xl font-bold mb-4 text-blue-900">Declaration</h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            By submitting this application, you confirm that all provided information is accurate and complete.
            Any false or misleading information may result in the rejection of your application or cancellation of admission.
            Please review all details carefully before proceeding.
          </p>
          <div className="flex items-center space-x-3 mb-6">
            <input
              type="checkbox"
              checked={declarations.infoCorrect}
              onChange={() => handleDeclarationChange('infoCorrect')}
              id="infoCorrect"
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
            />
            <label htmlFor="infoCorrect" className="text-sm text-gray-700 leading-relaxed">
              I confirm that all information provided in this application is true and correct to the best of my knowledge.
            </label>
          </div>

          {student_details?.signature_url && (
            <div className="signature-section">
              <img
                src={student_details.signature_url}
                alt="Signature"
                className="signature-img inline-block"
              />
              <p className="text-sm text-gray-600 mt-2 font-semibold">Applicant's Signature</p>
            </div>
          )}
        </div>

        {/* Declaration Section (Print Only) */}
        <div className="print-only" style={{ display: 'none' }}>
          <div className="print-signature-section">
            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8px', color: '#000', textAlign: 'center', textDecoration: 'underline' }}>
              DECLARATION
            </h3>
            <p style={{ fontSize: '9pt', lineHeight: '1.4', marginBottom: '8px', textAlign: 'justify', color: '#000' }}>
              I hereby declare that all the information provided in this application form is true and correct to the best of my knowledge and belief.
              I understand that any false or misleading information may result in the rejection of my application or cancellation of my admission.
              I have carefully reviewed all the details mentioned above and confirm their accuracy.
            </p>
            <p style={{ fontSize: '9pt', lineHeight: '1.4', marginBottom: '15px', textAlign: 'justify', color: '#000' }}>
              I agree to abide by all the rules and regulations of the Centre for Distance and Online Education (CDOE), Periyar University,
              and understand that the university reserves the right to verify any information provided in this application.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '10px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '9pt', fontWeight: 'bold', color: '#000', marginBottom: '30px' }}>Place: _________________</p>
                <p style={{ fontSize: '9pt', fontWeight: 'bold', color: '#000' }}>Date: _________________</p>
              </div>

              <div className="print-signature-box">
                {student_details?.signature_url && (
                  <div>
                    <img
                      src={student_details.signature_url}
                      alt="Signature"
                      className="print-signature-img"
                      style={{ display: 'block', marginLeft: 'auto' }}
                    />
                  </div>
                )}
                <p className="print-signature-label" style={{ marginTop: '5px' }}>Applicant's Signature</p>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="print-footer">
            <p style={{ fontSize: '8pt', color: '#666', marginBottom: '2px' }}>
              Centre for Distance and Online Education (CDOE) | Periyar University
            </p>
            <p style={{ fontSize: '7pt', color: '#666' }}>
              Salem-636011, Tamilnadu, India | Website: www.periyaruniversity.ac.in
            </p>
          </div>
        </div>

        {/* Action Buttons (No Print) */}
        <div className="no-print mt-8 flex flex-wrap justify-between gap-4">
          <button
            onClick={() => navigate('/student/application/page4')}
            className="action-button btn-back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/student/application/page1')}
              className="action-button btn-edit"
            >
              <PencilIcon className="h-5 w-5" />
              <span>Edit</span>
            </button>

            <button
              onClick={handlePrint}
              className="action-button btn-print"
            >
              <PrinterIcon className="h-5 w-5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleProceedToPayment}
              disabled={!allDeclarationsChecked}
              className={`action-button ${allDeclarationsChecked ? 'btn-proceed' : 'btn-disabled'}`}
            >
              <CreditCardIcon className="h-5 w-5" />
              <span>Proceed to Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
