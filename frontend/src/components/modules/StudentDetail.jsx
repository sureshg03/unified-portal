import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Printer, Loader2, Check, X, Eye, CheckCircle2 } from 'lucide-react';

const StudentDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docValidation, setDocValidation] = useState({
    sslc_valid: null,
    hsc_valid: null,
    ug_valid: null,
    community_valid: null,
    aadhaar_valid: null,
    tc_valid: null,
  });
  const [eligibilityStatus, setEligibilityStatus] = useState('');
  const [admissionStatus, setAdmissionStatus] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [notEligibleReason, setNotEligibleReason] = useState('');
  const [notConfirmedReason, setNotConfirmedReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [academicYear, setAcademicYear] = useState('2025-26');

  const pathParts = location.pathname.split('/');
  // Extract applicationId from URL - handle IDs that contain slashes
  const verifyIndex = pathParts.indexOf('verify');
  const applicationId = verifyIndex !== -1 && verifyIndex < pathParts.length - 1
    ? pathParts.slice(verifyIndex + 1).join('/')
    : pathParts[pathParts.length - 1];

  console.log('StudentDetail - Current path:', location.pathname);
  console.log('StudentDetail - Path parts:', pathParts);
  console.log('StudentDetail - Extracted applicationId:', applicationId);

  useEffect(() => {
    if (applicationId && applicationId !== 'verify') {
      fetchStudentDetails();
      fetchAcademicYear();
    } else {
      console.error('Invalid application ID:', applicationId);
      toast.error('Invalid application ID in URL');
    }
  }, [applicationId]);

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

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/lsc-admin/student-details/${applicationId}/`
      );

      if (response.data?.status === 'success' && response.data?.data) {
        const data = response.data.data;
        setStudent(data);

        // Set validation states
        if (data.document_validation) {
          setDocValidation(data.document_validation);
        }

        // Set form states
        setEligibilityStatus(data.eligibility_status || '');
        setAdmissionStatus(data.admission_confirmed ? 'Confirmed' : '');
        setEnrollmentNo(data.enrollment_no || '');
      } else {
        toast.error('Failed to load student details');
      }
    } catch (error) {
      console.error('Error fetching student details:', error, error.response?.data || error);
      toast.error(`Failed to load student details: ${formatAxiosError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentValidation = async (docType, isValid) => {
    console.log('handleDocumentValidation called:', { docType, isValid, applicationId });
    
    try {
      const response = await axios.post('http://localhost:8000/api/lsc-admin/validate-document/', {
        application_id: applicationId,
        document_type: docType,
        is_valid: isValid
      });

      console.log('Validation response:', response.data);

      if (response.data.status === 'success') {
        setDocValidation(prev => {
          const updated = { ...prev, [docType]: isValid };
          console.log('Updated docValidation:', updated);
          return updated;
        });
        toast.success(`Document ${isValid ? 'marked as valid' : 'marked as invalid'} successfully`);
      } else {
        toast.error(response.data.message || 'Failed to update document validation');
      }
    } catch (error) {
      console.error('Error validating document:', error, error.response?.data || error);
      toast.error(`Failed to update document validation: ${formatAxiosError(error)}`);
    }
  };

  const handleEligibilityChange = (value) => {
    setEligibilityStatus(value);
    if (value === 'Eligible') {
      setNotEligibleReason('');
    }
  };

  const handleAdmissionChange = async (value) => {
    setAdmissionStatus(value);
    if (value === 'Confirmed') {
      setNotConfirmedReason('');
      // Generate enrollment number if eligible and confirmed
      if (eligibilityStatus === 'Eligible') {
        await generateEnrollmentNumber();
      } else {
        toast.warning('Please set Eligibility Status to "Eligible" first');
      }
    } else {
      setEnrollmentNo('');
    }
  };

  const generateEnrollmentNumber = async () => {
    try {
      toast.info('Generating enrollment number...');
      const response = await axios.post('http://localhost:8000/api/lsc-admin/generate-enrollment/', {
        application_id: applicationId
      });

      console.log('Enrollment response:', response.data);

      if (response.data.status === 'success' && response.data.enrollment_no) {
        setEnrollmentNo(response.data.enrollment_no);
        toast.success(`Enrollment number generated: ${response.data.enrollment_no}`);
      } else {
        toast.error('Failed to generate enrollment number');
      }
    } catch (error) {
      console.error('Error generating enrollment number:', error, error.response?.data || error);
      const errorMsg = error.response?.data?.message || formatAxiosError(error) || 'Failed to generate enrollment number';
      toast.error(errorMsg);
    }
  };

  const handleSaveVerification = async () => {
    try {
      setSaving(true);

      const payload = {
        application_id: applicationId,
        eligibility_status: eligibilityStatus,
        eligibility_reason: notEligibleReason,
        admission_status: admissionStatus,
        admission_reason: notConfirmedReason,
        enrollment_no: enrollmentNo,
        document_validation: docValidation
      };

      console.log('Saving verification with payload:', payload);

      const response = await axios.post('http://localhost:8000/api/lsc-admin/save-verification/', payload);

      console.log('Save verification response:', response.data);

        if (response.data.status === 'success') {
          toast.success('Verification details saved successfully!', { autoClose: 3000 });
        await fetchStudentDetails(); // Refresh data
      } else {
        toast.error(response.data.message || 'Failed to save verification details');
      }
    } catch (error) {
      console.error('Error saving verification:', error, error.response?.data || error);
      toast.error(error.response?.data?.message || formatAxiosError(error) || 'Failed to save verification details. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const viewDocument = (url) => {
    if (!url) {
      toast.error('Document not available');
      return;
    }
    window.open(`http://127.0.0.1:8000${url}`, '_blank');
  };

  const formatAxiosError = (error) => {
    if (!error) return 'Unknown error';
    const status = error.response?.status;
    const data = error.response?.data;
    if (status || data) return `${status || ''} - ${JSON.stringify(data)}`;
    return error.message || String(error);
  };

  const formatAddress = (type) => {
    if (!student) return 'Not Provided';

    const area = student[`${type}_area`] || '';
    const town = student[`${type}_town`] || '';
    const district = student[`${type}_district`] || '';
    const state = student[`${type}_state`] || '';
    const country = student[`${type}_country`] || '';
    const pincode = student[`${type}_pincode`] || '';

    const parts = [area, town, district, state, country, pincode].filter(p => p);
    return parts.length > 0 ? parts.join(', ') : 'Not Provided';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch (e) {
      return dateStr;
    }
  };

  const parseSubjects = (subjectData) => {
    if (!subjectData) return 'Not Specified';

    try {
      if (typeof subjectData === 'string') {
        if (subjectData.trim().startsWith('[') || subjectData.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(subjectData);
            if (Array.isArray(parsed)) {
              return parsed.map(item => {
                if (typeof item === 'object' && item !== null) {
                  return item.name || item.subject || JSON.stringify(item);
                }
                return String(item);
              }).join(', ');
            } else if (typeof parsed === 'object') {
              return Object.values(parsed).filter(v => v).join(', ');
            }
          } catch {
            return subjectData;
          }
        }
        return subjectData;
      }

      if (Array.isArray(subjectData)) {
        return subjectData.map(item => {
          if (typeof item === 'object' && item !== null) {
            return item.name || item.subject || JSON.stringify(item);
          }
          return String(item);
        }).filter(s => s).join(', ');
      }

      if (typeof subjectData === 'object' && subjectData !== null) {
        return Object.values(subjectData).filter(v => v).join(', ');
      }

      return String(subjectData);
    } catch (error) {
      console.error('Error parsing subjects:', error);
      return 'Not Specified';
    }
  };

  const parseMonthYear = (qual) => {
    let monthOfPassing = '';
    let yearOfPassing = '';

    if (qual.month_year || qual.month_year_of_passing) {
      const monthYear = qual.month_year || qual.month_year_of_passing;
      if (typeof monthYear === 'string' && monthYear.includes('/')) {
        const parts = monthYear.split('/');
        monthOfPassing = parts[0];
        yearOfPassing = parts[1];
      } else {
        monthOfPassing = monthYear;
      }
    } else {
      monthOfPassing = qual.month_of_passing || qual.month || '';
      yearOfPassing = qual.year_of_passing || qual.year || '';
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthOfPassing && !isNaN(Number(monthOfPassing))) {
      const monthNum = parseInt(monthOfPassing);
      if (monthNum >= 1 && monthNum <= 12) {
        monthOfPassing = monthNames[monthNum - 1];
      }
    }

    return { month: monthOfPassing, year: yearOfPassing };
  };

  const handlePrintApplication = () => {
    if (!student) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the application');
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Application - ${student.application_id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: landscape; margin: 10mm; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; color: #000; background: #fff; padding: 10mm; }
        .header { text-align: center; border-bottom: 3px solid #7401b6; padding-bottom: 15px; margin-bottom: 20px; }
        .university-name { font-size: 24pt; font-weight: bold; color: #7401b6; margin-bottom: 5px; }
        .university-subtitle { font-size: 10pt; color: #000; margin: 3px 0; }
        .cdoe-title { font-size: 12pt; font-weight: bold; color: #7401b6; margin: 10px 0 5px 0; text-transform: uppercase; }
        .main-title { font-size: 11pt; font-weight: bold; text-decoration: underline; margin: 15px 0; text-align: center; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 2px solid #000; }
        .info-table td { border: 1px solid #000; padding: 10px; font-size: 10pt; }
        .info-label { font-weight: bold; min-width: 140px; display: inline-block; }
        .content-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #000; font-size: 10pt; }
        .content-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
        .row-number { width: 35px; text-align: center; font-weight: bold; background: #e9ecef; }
        .field-label { width: 220px; font-weight: 500; background: #f8f9fa; }
        .field-separator { width: 20px; text-align: center; font-weight: bold; }
        .field-value { font-weight: 600; }
        .section-header { background: #e9ecef; border: 1px solid #000; padding: 10px; font-weight: bold; margin: 15px 0 10px 0; font-size: 11pt; }
        .education-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px; }
        .education-table th, .education-table td { border: 1px solid #000; padding: 5px; text-align: left; }
        .education-table th { background: #e9ecef; font-weight: bold; }
        .signature-section { margin-top: 30px; text-align: center; padding-right: 50px; }
        .signature-line { border-top: 2px solid #000; width: 200px; margin: 40px auto 8px auto; }
        .signature-label { font-weight: 600; text-align: center; width: 200px; margin: 0 auto; }
        @media print { body { padding: 0; } .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="university-name">Periyar University</div>
        <div class="university-subtitle">State University - NAAC 'A+' Grade - NIRF Rank 94</div>
        <div class="university-subtitle">Salem-636011, Tamil Nadu, India</div>
        <div class="cdoe-title">Centre for Distance and Online Education (CDOE)</div>
        <div class="university-subtitle">Open and Distance Learning</div>
    </div>

    <div class="main-title">
        Open and Distance Learning Programme (ODL) Admission for Academic Year ${student.academic_year || '2025'}
    </div>

    <table class="info-table">
        <tr>
            <td><span class="info-label">Application No:</span> ${student.application_id || 'N/A'}</td>
            <td rowspan="4" style="text-align: center; width: 120px;">
                ${student.photo_url ? `<img src="http://127.0.0.1:8000${student.photo_url}" alt="Photo" style="width: 100px; height: 120px; border: 1px solid #000;" />` : '<div style="width: 100px; height: 120px; border: 1px solid #000; display: flex; align-items: center; justify-content: center;">Photo</div>'}
            </td>
        </tr>
        <tr>
            <td><span class="info-label">Enrollment No:</span> ${enrollmentNo || 'Pending'}</td>
        </tr>
        <tr>
            <td><span class="info-label">Applied Date:</span> ${student.applied_date || new Date().toLocaleDateString('en-GB')}</td>
        </tr>
        <tr>
            <td><span class="info-label">Eligibility Verified By:</span> ${student.verified_by || 'Pending'}</td>
        </tr>
        <tr>
            <td><span class="info-label">LSC:</span> ${student.lsc_name || 'N/A'}</td>
            <td>
                ${student.verified_date ? `<span class="info-label">Verification Date:</span> ${new Date(student.verified_date).toLocaleDateString('en-GB')}` : ''}
            </td>
        </tr>
    </table>

    <table class="content-table">
        <tr>
            <td class="row-number">1.</td>
            <td class="field-label">Programme Applied</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.programme || 'N/A'}</td>
            <td class="field-label">Course</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.course || 'N/A'}</td>
        </tr>
        <tr>
            <td class="row-number">2.</td>
            <td class="field-label">Medium</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.medium || 'English'}</td>
            <td class="field-label">Name of Applicant</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.name || 'N/A'}</td>
        </tr>
        <tr>
            <td class="row-number">3.</td>
            <td class="field-label">Date of Birth</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.dob || 'N/A'}</td>
            <td class="field-label">Father & Mother Name</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.father_name || 'N/A'} - ${student.mother_name || 'N/A'}</td>
        </tr>
        <tr>
            <td class="row-number">4.</td>
            <td class="field-label">Father's Occupation</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.father_occupation || 'N/A'}</td>
            <td class="field-label">Gender</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.gender || 'N/A'}</td>
        </tr>
        <tr>
            <td class="row-number">5.</td>
            <td class="field-label">Mother Tongue</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.mother_tongue || 'N/A'}</td>
            <td class="field-label">Nationality</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.nationality || 'Indian'}</td>
        </tr>
        <tr>
            <td class="row-number">6.</td>
            <td class="field-label">Religion</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.religion || 'N/A'}</td>
            <td class="field-label">Community</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.community || 'N/A'}</td>
        </tr>
    </table>

    <div class="section-header">11. Communication Address &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Permanent Address</div>
    <table class="content-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">${formatAddress('comm')}</td>
            <td style="width: 50%; vertical-align: top;">${formatAddress('perm')}</td>
        </tr>
    </table>

    <table class="content-table">
        <tr>
            <td class="row-number">12.</td>
            <td class="field-label">Mobile No.</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.phone || 'N/A'}</td>
            <td class="field-label">E-mail ID</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.email || 'N/A'}</td>
        </tr>
        <tr>
            <td class="row-number">13.</td>
            <td class="field-label">Aadhaar No.</td>
            <td class="field-separator">:</td>
            <td class="field-value">${student.aadhaar_no || 'N/A'}</td>
            <td class="field-label"></td>
            <td class="field-separator"></td>
            <td class="field-value"></td>
        </tr>
    </table>

    <div class="section-header">Educational Qualification</div>
    <table class="education-table">
        <thead>
            <tr>
                <th>Course</th>
                <th>Institution</th>
                <th>Board</th>
                <th>Subjects Studied</th>
                <th>Register No</th>
                <th>%</th>
                <th>Month</th>
                <th>Year</th>
                <th>Mode</th>
            </tr>
        </thead>
        <tbody>
            ${student.qualifications && student.qualifications.length > 0 ? student.qualifications.map(qual => {
                const { month, year } = parseMonthYear(qual);
                return `<tr>
                    <td>${qual.course || 'N/A'}</td>
                    <td>${qual.institution || 'N/A'}</td>
                    <td>${qual.board || 'N/A'}</td>
                    <td>${parseSubjects(qual.subjects_studied)}</td>
                    <td>${qual.reg_no || 'N/A'}</td>
                    <td>${qual.percentage || 'N/A'}</td>
                    <td>${month}</td>
                    <td>${year}</td>
                    <td>${qual.mode_of_study || 'Regular'}</td>
                </tr>`;
            }).join('') : '<tr><td colspan="9">No qualification data available</td></tr>'}
        </tbody>
    </table>

    <div style="margin: 20px 0; text-align: justify;">
        <strong>DECLARATION:</strong> I hereby declare that the information given above are true to the best of my knowledge and that I shall, if admitted abide by the rules of the University.
    </div>

    <div class="signature-section">
        ${student.signature_url ? `<img src="http://127.0.0.1:8000${student.signature_url}" alt="Signature" style="height: 50px;" />` : '<div style="height: 50px; border-bottom: 1px solid #000; display: inline-block; width: 200px;"></div>'}
        <div class="signature-label">Signature of the Applicant</div>
    </div>

    <div style="text-align: center; margin-top: 30px; font-size: 10pt; color: #666;">
        © Periyar University, Salem, All Rights Reserved.
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading Student Details...</p>
          <p className="text-gray-500">Please wait while we fetch the application information</p>
        </div>
      </div>
    );
  }

  if (!applicationId || applicationId === 'verify' || applicationId === 'unknown') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
              {/* Decorative emoji removed for professional UI */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Application ID</h2>
          <p className="text-gray-600 mb-6">The application ID "{applicationId}" is not valid.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          {/* Decorative emoji removed for professional UI */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Not Found</h2>
          <p className="text-gray-600 mb-6">No student details found for the provided application ID.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap');
          
          body, * {
            font-family: 'Roboto', sans-serif;
          }

          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white;
            }
          }

          /* Application Form Table Styles */
          .app-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            border: 1px solid #000;
          }

          .app-table td, .app-table th {
            border: 1px solid #000;
            padding: 8px 12px;
            vertical-align: top;
          }

          .app-header {
            background: #f5f5f5;
            font-weight: 500;
            text-align: left;
          }

          .app-value {
            font-weight: 400;
          }

          .section-header {
            background: #fff;
            font-weight: bold;
            padding: 10px 12px;
            border: 1px solid #000;
          }

          .two-column-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
          }

          .two-column-section > div {
            border: 1px solid #000;
            padding: 12px;
          }

          .edu-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }

          .edu-table th, .edu-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-size: 13px;
          }

          .edu-table th {
            background: #f5f5f5;
            font-weight: 600;
          }

          .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }

          .payment-table td {
            border: 1px solid #000;
            padding: 10px;
            font-size: 14px;
          }

          .payment-table .label {
            font-weight: 600;
            background: #f5f5f5;
            width: 200px;
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-8 py-6">
        
        {/* Action Buttons Bar - Top of Page */}
        <div className="no-print flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-600 text-white font-medium rounded-lg shadow hover:bg-gray-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to List
          </button>
          
          <button
            onClick={handlePrintApplication}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Application
          </button>
        </div>

        {/* Title Header */}
        <div className="text-center mb-4" style={{ borderBottom: '3px solid green', paddingBottom: '10px' }}>
          <h1 className="text-2xl font-bold" style={{ textDecoration: 'underline' }}>
            Open and Distance Learning Programme (ODL) Admission for the Academic Year 2025
          </h1>
        </div>

        {/* Header Section with Photo */}
        <table className="app-table mb-4">
          <tbody>
            <tr>
              <td className="app-header" style={{ width: '180px', fontWeight: 'bold' }}>Application No :</td>
              <td className="app-value" colSpan="2">{student.application_id}</td>
              <td rowSpan="3" style={{ width: '150px', textAlign: 'center', verticalAlign: 'middle', padding: '10px' }}>
                {student?.photo_url ? (
                  <img
                    src={`http://127.0.0.1:8000${student.photo_url}`}
                    alt="Student Photo"
                    style={{ width: '130px', height: '160px', objectFit: 'cover', border: '2px solid #000' }}
                  />
                ) : (
                  <div style={{ width: '130px', height: '160px', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>Photo</div>
                )}
              </td>
            </tr>
            <tr>
              <td className="app-header" style={{ fontWeight: 'bold' }}>Applied Date :</td>
              <td className="app-value" colSpan="2">{formatDate(student?.applied_date || student?.created_at)}</td>
            </tr>
            <tr>
              <td className="app-header" style={{ fontWeight: 'bold' }}>LSC :</td>
              <td className="app-value" colSpan="2">{student?.lsc_name || 'CDOE - Centre for Distance and Online Education (LC2101)'}</td>
            </tr>
          </tbody>
        </table>

        {/* Main Application Table */}
        <table className="app-table mb-4">
          <tbody>
            {/* Row 1: Programme Applied */}
            <tr>
              <td style={{ width: '40px', fontWeight: 'bold' }}>1.</td>
              <td style={{ width: '280px' }}>Programme Applied</td>
              <td style={{ width: '10px', textAlign: 'center' }}>:</td>
              <td>{student?.programme || student?.programme_applied || 'N/A'}</td>
              <td rowSpan="3" style={{ width: '120px', fontWeight: '600' }}>PBA</td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '20px' }}>Course</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td>{student?.course || 'N/A'}</td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '20px' }}>Medium</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td>{student?.medium || 'English'}</td>
            </tr>

            {/* Row 2: Name */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>2.</td>
              <td>Name of the Applicant</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.name || student?.student_name || 'N/A'}</td>
            </tr>

            {/* Row 3: DOB */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>3.</td>
              <td>Date of Birth</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{formatDate(student?.dob)}</td>
            </tr>

            {/* Row 4: Parents & Guardian */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>4.</td>
              <td>(a) Name of the Father & Mother</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.father_name || 'N/A'} - {student?.mother_name || 'N/A'}</td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '20px' }}>(b) Name of the Guardian</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.guardian_name || 'N/A'}</td>
            </tr>

            {/* Row 5: Parents Occupation */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>5.</td>
              <td>Father's & Mother's Occupation</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.father_occupation || 'N/A'} - {student?.mother_occupation || 'N/A'}</td>
            </tr>

            {/* Row 6: Gender */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>6.</td>
              <td>Gender</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.gender || 'N/A'}</td>
            </tr>

            {/* Row 7: Mother Tongue */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>7.</td>
              <td>Mother Tongue</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.mother_tongue || 'N/A'}</td>
            </tr>

            {/* Row 8: Nationality */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>8.</td>
              <td>Nationality</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.nationality || 'Indian'}</td>
            </tr>

            {/* Row 9: Religion */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>9.</td>
              <td>Religion</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.religion || 'N/A'}</td>
            </tr>

            {/* Row 10: Community */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>10.</td>
              <td>Community</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.community || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        {/* Two Column Section - Communication & Permanent Address */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #000', padding: '12px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>11. Communication Address</h3>
            <p>{formatAddress('comm')}</p>
          </div>
          <div style={{ border: '1px solid #000', borderLeft: '0', padding: '12px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Permanent Address</h3>
            <p>{formatAddress('perm')}</p>
          </div>
        </div>

        {/* Contact Details Table */}
        <table className="app-table mb-4">
          <tbody>
            {/* Row 12: Mobile */}
            <tr>
              <td style={{ width: '40px', fontWeight: 'bold' }}>12.</td>
              <td style={{ width: '280px' }}>Mobile No. / Telephone No.</td>
              <td style={{ width: '10px', textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.phone || student?.mobile || 'N/A'}</td>
            </tr>

            {/* Row 13: Email */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>13.</td>
              <td>E-mail ID</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.email || 'N/A'}</td>
            </tr>

            {/* Row 14: Aadhaar, ABC ID, DEB ID */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>14.</td>
              <td>(a)Aadhaar Card No. & Aadhaar Name</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td>{student?.aadhaar_number || student?.aadhaar_no || 'N/A'}</td>
              <td>{student?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '20px' }}>(b)ABC ID</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.abc_id || 'N/A'}</td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '20px' }}>(c)DEB ID</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.deb_id || 'N/A'}</td>
            </tr>

            {/* Row 15: Differently Abled */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>15.</td>
              <td>Differently Abled</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.differently_abled || 'No'}</td>
            </tr>

            {/* Row 16: Blood Group */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>16.</td>
              <td>Blood Group</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.blood_group || 'N/A'}</td>
            </tr>

            {/* Row 17: Access to Internet */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>17.</td>
              <td>Access to Internet</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td colSpan="2">{student?.internet_access || 'Yes'}</td>
            </tr>
          </tbody>
        </table>

        {/* Section 18: Education Qualification */}
        <div className="mb-4">
          <h2 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>18.Education Qualification</h2>
          {student.qualifications && student.qualifications.length > 0 ? (
            <table className="edu-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Institution</th>
                  <th>Board</th>
                  <th>Subject Studied</th>
                  <th>Register No</th>
                  <th>Percentage</th>
                  <th>Month of Passing</th>
                  <th>Year of Passing</th>
                  <th>Mode of Study</th>
                </tr>
              </thead>
              <tbody>
                {student.qualifications.map((qual, idx) => {
                  const { month, year } = parseMonthYear(qual);
                  return (
                    <tr key={idx}>
                      <td>{qual.course || qual.exam_passed || 'N/A'}</td>
                      <td>{qual.institution || qual.institute_name || qual.board_university || 'N/A'}</td>
                      <td>{qual.board || qual.university || 'N/A'}</td>
                      <td>{parseSubjects(qual.subjects_studied || qual.subject_studied || qual.subjects)}</td>
                      <td style={{ textAlign: 'center' }}>{qual.reg_no || qual.register_no || qual.register_number || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{qual.percentage || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{month || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{year || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{qual.mode_of_study || 'Regular'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No educational qualifications data available</p>
          )}
        </div>

        {/* Section 19: Working Experience */}
        <div className="mb-4">
          <h2 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>19.Working Experience</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: '600', textAlign: 'left' }}>Current Designation</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: '600', textAlign: 'left' }}>Current Working Institution</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: '600', textAlign: 'left' }}>Working Experience in Years</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: '600', textAlign: 'left' }}>Annual Income in Rs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{student.current_designation || student.work_des || 'Student'}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{student.current_institute || student.work_org || 'NA'}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{student.years_experience || student.years_of_experience || '0'}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{student.annual_income || '0'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Status Section */}
        <div className="mb-4">
          <h2 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '15px', textAlign: 'center' }}>Payment Status</h2>
          <table className="payment-table">
            <tbody>
              <tr>
                <td className="label">Order ID</td>
                <td>{student.order_id || 'PUCDOE1751435696'}</td>
                <td className="label">Amount</td>
                <td>{student.amount || student.payment_amount || '354.00'}</td>
                <td className="label">Status</td>
                <td>{student.payment_status || 'TXN_SUCCESS'}</td>
              </tr>
              <tr>
                <td className="label">Bank Name</td>
                <td>{student.bank_name || ''}</td>
                <td className="label">Payment Mode</td>
                <td>{student.payment_mode || student.payment_method || 'UPI'}</td>
                <td className="label">Transaction Date & Time</td>
                <td>{student.transaction_date || student.payment_date || '2025-07-02 11:25:07'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Declaration Section */}
        <div className="mb-6" style={{ border: '1px solid #000', padding: '15px' }}>
          <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>DECLARATION:</strong> I declare that the information given above are true to the best of my knowledge and that I shall, if admitted abide by the rules of the University.
          </p>
          <div style={{ marginBottom: '15px' }}>
            <strong>Date:</strong> 11-11-2025
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Place:</strong>
          </div>
          <div style={{ textAlign: 'right', marginTop: '60px' }}>
            {student?.signature_url && (
              <img
                src={`http://127.0.0.1:8000${student.signature_url}`}
                alt="Signature"
                style={{ width: '150px', height: '60px', marginBottom: '10px' }}
              />
            )}
            <div style={{ fontWeight: 'bold' }}>Signature of the Applicant</div>
          </div>
        </div>

        {/* Document Validation Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-teal-200 to-cyan-200 text-black px-6 py-3 rounded-lg shadow-lg">
              {/* Icon removed for professional UI */}
              <h3 className="text-xl font-bold">Document Validation</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-teal-600 to-cyan-600"></div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
            <p className="text-base text-gray-700 mb-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <span className="font-semibold text-blue-800">Instructions:</span> Click Valid/Invalid for each document to mark its verification status
            </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'SSLC Marksheet', type: 'sslc_valid', url: student.sslc_marksheet_url, key: 'SSLC', resubmitKey: 'sslc' },
              { label: 'HSC Marksheet', type: 'hsc_valid', url: student.hsc_marksheet_url, key: 'HSC', resubmitKey: 'hsc' },
              { label: 'UG Certificate', type: 'ug_valid', url: student.ug_marksheet_url, key: 'UG', resubmitKey: 'ug' },
              { label: 'Community Certificate', type: 'community_valid', url: student.community_certificate_url, key: 'COMMUNITY', resubmitKey: 'community' },
              { label: 'Aadhaar Card', type: 'aadhaar_valid', url: student.aadhaar_url, key: 'AADHAAR', resubmitKey: 'aadhaar' },
              { label: 'Transfer Certificate', type: 'tc_valid', url: student.transfer_certificate_url, key: 'TC', resubmitKey: 'tc' },
            ].map((doc, idx) => {
              const resubmittedDoc = docValidation?.resubmitted?.[doc.resubmitKey];
              const hasResubmission = resubmittedDoc && resubmittedDoc.path;
              
              return (
              <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-800">{doc.label}</span>
                  <div className="flex gap-2 items-center">
                    {docValidation[doc.type] !== null && (
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        docValidation[doc.type] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {docValidation[doc.type] ? 'VALID' : 'INVALID'}
                      </span>
                    )}
                    {hasResubmission && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        RESUBMITTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Original Document */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('View button clicked for:', doc.url);
                      viewDocument(doc.url);
                    }}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      doc.url
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!doc.url}
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View Original
                  </button>
                </div>

                {/* Resubmitted Document Section */}
                {hasResubmission && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-900">
                         Resubmitted Document
                      </span>
                      <span className="text-xs text-blue-700">
                        {new Date(resubmittedDoc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          viewDocument(`/media/${resubmittedDoc.path}`);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        View Resubmitted
                      </button>
                      <span className="text-xs text-blue-700 flex items-center">
                        Status: {resubmittedDoc.status === 'pending_review' ? '⏳ Pending Review' : '✅ Reviewed'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Valid button clicked for:', doc.type);
                      handleDocumentValidation(doc.type, true);
                    }}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      docValidation[doc.type] === true
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    Valid
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Invalid button clicked for:', doc.type);
                      handleDocumentValidation(doc.type, false);
                    }}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      docValidation[doc.type] === false
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Invalid
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
        </div>

        {/* Verification & Admission Process Section - Professional Design */}
        <div className="no-print bg-white border border-gray-300 rounded-lg shadow-sm mt-6 mb-6">
          {/* Section Header */}
          <div className="bg-gray-100 border-b border-gray-300 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800">Verification & Admission Process</h3>
          </div>

          <div className="p-6">
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Eligibility Status */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Eligibility Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={eligibilityStatus}
                  onChange={(e) => handleEligibilityChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">--Select--</option>
                  <option value="Eligible">Eligible</option>
                  <option value="Not Eligible">Not Eligible</option>
                </select>
                
                {eligibilityStatus === 'Eligible' && (
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Student is eligible for admission</span>
                  </div>
                )}
                
                {eligibilityStatus === 'Not Eligible' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      If Not Eligible (Reason)
                    </label>
                    <textarea
                      value={notEligibleReason}
                      onChange={(e) => setNotEligibleReason(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter reason for not eligible"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Admission Status */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Admission Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={admissionStatus}
                  onChange={(e) => handleAdmissionChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={eligibilityStatus !== 'Eligible'}
                >
                  <option value="">--Select--</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Not Confirmed">Not Confirmed</option>
                </select>

                {eligibilityStatus !== 'Eligible' && (
                  <p className="text-sm text-orange-600">
                    Please set eligibility status to "Eligible" first
                  </p>
                )}

                {admissionStatus === 'Confirmed' && eligibilityStatus === 'Eligible' && !enrollmentNo && (
                  <p className="text-sm text-blue-600">
                    Enrollment number will be generated upon saving
                  </p>
                )}

                {admissionStatus === 'Not Confirmed' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      If Admission is not Confirmed (Reason)
                    </label>
                    <textarea
                      value={notConfirmedReason}
                      onChange={(e) => setNotConfirmedReason(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter reason for not confirmed"
                      rows={3}
                    />
                  </div>
                )}

                {admissionStatus === 'Confirmed' && eligibilityStatus === 'Eligible' && enrollmentNo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700 mb-1">If Admission is Confirmed, Enrollment No. Alloted</p>
                    <p className="text-lg font-semibold text-green-800 font-mono">{enrollmentNo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Eligibility Verified By Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">Eligibility Verified by</h4>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 text-sm">LC2101</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">{new Date().toLocaleDateString('en-GB')}</td>
                    <td className="border border-gray-300 px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {/* Send Invalid Document Email Button */}
              <button
                onClick={async () => {
                  const invalidDocs = Object.entries(docValidation)
                    .filter(([_, isValid]) => isValid === false)
                    .map(([docType, _]) => docType.replace('_valid', ''));

                  if (invalidDocs.length === 0) {
                    toast.warning('No invalid documents marked. Please mark documents as Invalid first.');
                    return;
                  }

                  try {
                    setSaving(true);
                    const response = await axios.post('http://localhost:8000/api/lsc-admin/send-invalid-document-email/', {
                      application_id: applicationId,
                      invalid_documents: invalidDocs,
                      verified_by: 'LSC Admin'
                    });

                    if (response.data.status === 'success') {
                      toast.success(`Email sent successfully to student for ${invalidDocs.length} invalid document(s)!`, {
                        autoClose: 5000
                      });
                      await fetchStudentDetails();
                    } else {
                      toast.error(response.data.message || 'Failed to send email');
                    }
                  } catch (error) {
                    console.error('Error sending email:', error, error.response?.data || error);
                    toast.error(error.response?.data?.message || formatAxiosError(error) || 'Failed to send invalid document email.');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || Object.values(docValidation).filter(v => v === false).length === 0}
                className={`px-5 py-2.5 rounded font-medium text-sm transition-colors flex items-center gap-2 ${
                  Object.values(docValidation).filter(v => v === false).length === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <X className="w-4 h-4" />
                {saving ? 'Sending Email...' : `Send Email for Invalid Docs (${Object.values(docValidation).filter(v => v === false).length})`}
              </button>

              {/* Save Verification Button */}
              <button
                onClick={handleSaveVerification}
                disabled={saving}
                className="px-5 py-2.5 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Verification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Admission Allocation & Signatures */}
        <div className="mb-10">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">If Admission is Confirmed, Enrollment No. Alloted</label>
                <div className="w-full bg-gray-50 rounded p-3 border border-gray-100 text-gray-900 font-medium">{enrollmentNo || 'N/A'}</div>
              </div>
              <div className="text-right">
                {/* Duplicate print button removed - use fixed print button on top-right */}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Signatures & Footer */}
        <div className="mb-12">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center py-6">
              <div className="border-r md:border-r-0">
                <p className="font-semibold">Superintendent</p>
                <div className="h-12 mt-6 border-b border-gray-200"></div>
              </div>
              <div>
                <p className="font-semibold">Assistant Registrar</p>
                <div className="h-12 mt-6 border-b border-gray-200"></div>
              </div>
              <div>
                <p className="font-semibold">Director</p>
                <div className="h-12 mt-6 border-b border-gray-200"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">© Periyar University, Salem, All Right Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
