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
    } else {
      console.error('Invalid application ID:', applicationId);
      toast.error('Invalid application ID in URL');
    }
  }, [applicationId]);

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
    try {
      const response = await axios.post('http://localhost:8000/api/lsc-admin/validate-document/', {
        application_id: applicationId,
        document_type: docType,
        is_valid: isValid
      });

      if (response.data.status === 'success') {
        setDocValidation(prev => ({ ...prev, [docType]: isValid }));
        toast.success(`Document ${isValid ? 'validated' : 'marked invalid'}`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Fixed Print Button - Top Right */}
      <button
        onClick={handlePrintApplication}
        className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded shadow-lg hover:bg-red-700"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Applications
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Student Verification Portal</h1>
            <p className="text-sm text-gray-600">Centre for Distance and Online Education</p>
          </div>
          {/* Print button removed from header to avoid duplicates - use top-right fixed print */}
        </div>

        {/* Printable Application Form (Mirrors Print Template) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-800">Periyar University</div>
              <div className="text-sm text-gray-600 mt-1">State University - NAAC 'A+' Grade - NIRF Rank 94</div>
              <div className="text-sm text-gray-600">Salem-636011, Tamil Nadu, India</div>
              <div className="text-lg font-semibold text-indigo-700 mt-3">Centre for Distance and Online Education (CDOE)</div>
              <div className="text-base font-semibold mt-4 text-center">
                <div className="text-lg font-bold underline">Open and Distance Learning Programme (ODL) Admission for the Academic Year {student?.academic_year || '2025'}</div>
              </div>
            </div>
            <div className="text-right">
              {student?.photo_url ? (
                <img src={`http://127.0.0.1:8000${student.photo_url}`} alt="Photo" className="w-28 h-36 object-cover rounded border border-gray-200 shadow-sm" />
              ) : (
                <div className="w-28 h-36 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">Photo</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm block font-semibold text-gray-700">Application No :</label>
                  <div className="text-lg font-bold text-gray-800 mt-1">{student?.application_id || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm block font-semibold text-gray-700">Applied Date :</label>
                  <div className="text-lg text-gray-800 mt-1">{formatDate(student?.applied_date || student?.created_at)}</div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm block font-semibold text-gray-700">LSC :</label>
                <div className="text-base text-gray-700 mt-1">{student?.lsc_name || 'CDOE - Centre for Distance and Online Education (LC2101)'}</div>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>

          <table className="min-w-full border-collapse border border-gray-200">
            <tbody>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">1.</td>
                <td className="p-3 w-64 font-medium">Programme Applied</td>
                <td className="p-3">:</td>
                <td className="p-3 font-semibold">{student?.programme || student?.programme_applied || 'N/A'}</td>
                <td className="p-3 w-64 font-medium">Course</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.course || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold"> </td>
                <td className="p-3 font-medium">(a) Course</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.course || 'N/A'}</td>
                <td className="p-3 font-medium">(b) Medium</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.medium || 'English'}</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">2.</td>
                <td className="p-3 font-medium">Name of the Applicant</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.name || student?.student_name || 'N/A'}</td>
                <td className="p-3 font-medium">&nbsp;</td>
                <td className="p-3">&nbsp;</td>
                <td className="p-3">&nbsp;</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">3.</td>
                <td className="p-3 font-medium">Date of Birth</td>
                <td className="p-3">:</td>
                <td className="p-3">{formatDate(student?.dob)}</td>
                <td className="p-3 font-medium">Gender</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.gender || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">4.</td>
                <td className="p-3 font-medium">(a) Name of the Father & Mother</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.father_name || 'N/A'} - {student?.mother_name || 'N/A'}</td>
                <td className="p-3 font-medium">(b) Name of the Guardian</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.guardian_name || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">5.</td>
                <td className="p-3 font-medium">Mobile</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.phone || student?.mobile || 'N/A'}</td>
                <td className="p-3 font-medium">Email</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.email || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">6.</td>
                <td className="p-3 font-medium">Aadhaar Number</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.aadhaar_number || student?.aadhaar_no || 'N/A'}</td>
                <td className="p-3 font-medium">Nationality</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.nationality || 'Indian'}</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">2.</td>
                <td className="p-3 font-medium">Medium</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.medium || 'English'}</td>
                <td className="p-3 font-medium">Name of the Applicant</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.name || student?.student_name || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="w-12 p-3 bg-gray-50 font-semibold">3.</td>
                <td className="p-3 font-medium">Date of Birth</td>
                <td className="p-3">:</td>
                <td className="p-3">{formatDate(student?.dob)}</td>
                <td className="p-3 font-medium">Father & Mother</td>
                <td className="p-3">:</td>
                <td className="p-3">{student?.father_name || 'N/A'} - {student?.mother_name || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Comprehensive Student Details Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2 text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Student Application Details
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
          </div>

        {/* Application Header Info */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 mb-8 border border-blue-200 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-white rounded-lg p-6 shadow-md border border-blue-100">
              {/* Decorative icon removed */}
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Application ID</div>
              <div className="text-2xl font-bold text-blue-800 bg-blue-50 px-4 py-2 rounded-lg">{student.application_id}</div>
            </div>
            <div className="text-center bg-white rounded-lg p-6 shadow-md border border-green-100">
              {/* Decorative icon removed */}
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Enrollment Number</div>
              <div className="text-2xl font-bold text-green-800 bg-green-50 px-4 py-2 rounded-lg">{enrollmentNo || 'Pending'}</div>
            </div>
            <div className="text-center bg-white rounded-lg p-6 shadow-md border border-yellow-100">
              {/* Payment icon removed - status shown below */}
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Payment Status</div>
              <span className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold ${
                student.payment_status === 'Paid' ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-red-100 text-red-800 border-2 border-red-300'
              }`}>
                {student.payment_status === 'Paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {/* Icon removed for professional UI */}
              <h3 className="text-xl font-bold">Personal Information</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-purple-600 to-pink-600"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <p className="text-lg font-semibold text-gray-900">{student.name || student.student_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <p className="text-lg text-gray-900">{student.dob || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <p className="text-lg text-gray-900">{student.gender || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <p className="text-lg text-gray-900">{student.email || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <p className="text-lg text-gray-900">{student.phone || student.mobile || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number</label>
              <p className="text-lg text-gray-900">{student.aadhaar_number || student.aadhaar_no || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
              <p className="text-lg text-gray-900">{student.father_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name</label>
              <p className="text-lg text-gray-900">{student.mother_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
              <p className="text-lg text-gray-900">{student.nationality || 'Indian'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
              <p className="text-lg text-gray-900">{student.religion || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Community</label>
              <p className="text-lg text-gray-900">{student.community || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue</label>
              <p className="text-lg text-gray-900">{student.mother_tongue || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {/* Icon removed for professional UI */}
              <h3 className="text-xl font-bold">Academic Information</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-blue-600 to-cyan-600"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Programme</label>
              <p className="text-lg font-semibold text-blue-800">{student.programme || student.programme_applied || 'N/A'}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <p className="text-lg font-semibold text-blue-800">{student.course || 'N/A'}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Medium</label>
              <p className="text-lg font-semibold text-blue-800">{student.medium || 'English'}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <p className="text-lg font-semibold text-blue-800">{student.academic_year || '2025-26'}</p>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg">
              <div className="text-2xl">🏠</div>
              <h3 className="text-xl font-bold">Address Information</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-green-600 to-emerald-600"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-800 mb-3">Communication Address</h4>
              <p className="text-gray-900 whitespace-pre-line">{formatAddress('comm')}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-800 mb-3">Permanent Address</h4>
              <p className="text-gray-900 whitespace-pre-line">{formatAddress('perm')}</p>
            </div>
          </div>
        </div>

        {/* Educational Qualifications Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {/* Icon removed for professional UI */}
              <h3 className="text-xl font-bold">Educational Qualifications</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          {student.qualifications && student.qualifications.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Course</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Institution</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Board/University</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Subjects</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Register No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Percentage</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Month/Year</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {student.qualifications.map((qual, idx) => {
                    const { month, year } = parseMonthYear(qual);
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{qual.course || qual.exam_passed || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{qual.institution || qual.institute_name || qual.board_university || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{qual.board || qual.university || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{parseSubjects(qual.subjects_studied || qual.subject_studied || qual.subjects)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{qual.reg_no || qual.register_no || qual.register_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{qual.percentage || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{month && year ? `${month} ${year}` : 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{qual.mode_of_study || 'Regular'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
              {/* Icon removed for professional UI */}
              <p className="text-gray-600 text-lg">No educational qualifications data available</p>
              <p className="text-gray-500 text-sm mt-2">Educational qualification details will be displayed here once available</p>
            </div>
          )}
        </div>

        {/* Work Experience Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {/* Icon removed for professional UI */}
              <h3 className="text-xl font-bold">Work Experience</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-purple-600 to-indigo-600"></div>
          </div>
          {(student.work_exp || student.current_designation || student.work_org) ? (
            <div className="bg-purple-50 rounded-lg p-8 border border-purple-200 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Status</label>
                  <p className="text-lg text-gray-900">{student.current_designation || student.work_exp ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  <p className="text-lg text-gray-900">{student.current_institute || student.work_org || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                  <p className="text-lg text-gray-900">{student.current_designation || student.work_des || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <p className="text-lg text-gray-900">{student.years_experience || student.years_of_experience || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-purple-50 rounded-lg p-8 border border-purple-200 shadow-lg text-center">
              {/* Icon removed for professional UI */}
              <p className="text-gray-600 text-lg">No work experience data available</p>
              <p className="text-gray-500 text-sm mt-2">Work experience details will be displayed here if applicable</p>
            </div>
          )}
        </div>

        {/* Payment Information Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {/* Icon removed for professional UI */}
              <h3 className="text-xl font-bold">Payment Information</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-yellow-600 to-orange-600"></div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-8 border border-yellow-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                <p className="text-lg font-mono text-gray-900">{student.order_id || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <p className="text-lg font-bold text-green-800">₹ {student.amount || student.payment_amount || '236.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                <p className="text-lg text-gray-900">{student.payment_mode || student.payment_method || 'Online'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
                <p className="text-lg text-gray-900">{student.transaction_date || student.payment_date || 'N/A'}</p>
              </div>
            </div>
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
              { label: 'SSLC Marksheet', type: 'sslc_valid', url: student.sslc_marksheet_url, key: 'SSLC' },
              { label: 'HSC Marksheet', type: 'hsc_valid', url: student.hsc_marksheet_url, key: 'HSC' },
              { label: 'UG Certificate', type: 'ug_valid', url: student.ug_marksheet_url, key: 'UG' },
              { label: 'Community Certificate', type: 'community_valid', url: student.community_certificate_url, key: 'COMMUNITY' },
              { label: 'Aadhaar Card', type: 'aadhaar_valid', url: student.aadhaar_url, key: 'AADHAAR' },
              { label: 'Transfer Certificate', type: 'tc_valid', url: student.transfer_certificate_url, key: 'TC' },
            ].map((doc, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-800">{doc.label}</span>
                  {docValidation[doc.type] !== null && (
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      docValidation[doc.type] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {docValidation[doc.type] ? 'VALID' : 'INVALID'}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => viewDocument(doc.url)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      doc.url
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!doc.url}
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDocumentValidation(doc.type, true)}
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
                    onClick={() => handleDocumentValidation(doc.type, false)}
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
            ))}
          </div>
        </div>

        {/* Verification Section */}
        <div className="border-t-4 border-indigo-500 pt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8">
          <div className="flex items-center mb-8">
            <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg shadow-lg">
              {/* Icon removed for professional UI */}
              <h3 className="text-2xl font-bold">Verification & Admission Process</h3>
            </div>
            <div className="flex-1 ml-4 h-px bg-gradient-to-r from-indigo-600 to-purple-600"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Eligibility Status */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <label className="block text-lg font-semibold mb-3 text-gray-800">Eligibility Status</label>
              <select
                value={eligibilityStatus}
                onChange={(e) => handleEligibilityChange(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base font-semibold mb-3"
              >
                <option value="">-- Select Eligibility Status --</option>
                <option value="Eligible">Eligible</option>
                <option value="Not Eligible">Not Eligible</option>
              </select>
              {eligibilityStatus === 'Eligible' && (
                <p className="text-green-600 text-sm font-medium">Student is eligible for admission</p>
              )}
              {eligibilityStatus === 'Not Eligible' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2 text-red-700">Reason for Not Eligible</label>
                  <textarea
                    value={notEligibleReason}
                    onChange={(e) => setNotEligibleReason(e.target.value)}
                    className="w-full p-3 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="Enter detailed reason why not eligible"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Admission Status */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <label className="block text-lg font-semibold mb-3 text-gray-800">Admission Status</label>
              <select
                value={admissionStatus}
                onChange={(e) => handleAdmissionChange(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base font-semibold mb-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={eligibilityStatus !== 'Eligible'}
              >
                <option value="">-- Select Admission Status --</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Not Confirmed">Not Confirmed</option>
              </select>
              {eligibilityStatus !== 'Eligible' && (
                <p className="text-orange-600 text-sm font-medium">Please set Eligibility Status to "Eligible" first</p>
              )}
              {admissionStatus === 'Confirmed' && eligibilityStatus === 'Eligible' && (
                <p className="text-green-600 text-sm font-medium">Enrollment number will be generated automatically</p>
              )}
              {admissionStatus === 'Not Confirmed' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2 text-orange-700">Reason for Not Confirmed</label>
                  <textarea
                    value={notConfirmedReason}
                    onChange={(e) => setNotConfirmedReason(e.target.value)}
                    className="w-full p-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Enter detailed reason why admission not confirmed"
                    rows={3}
                  />
                </div>
              )}
              {admissionStatus === 'Confirmed' && eligibilityStatus === 'Eligible' && enrollmentNo && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-sm font-medium">Enrollment number successfully generated</p>
                  <p className="text-green-700 font-mono text-lg font-bold">{enrollmentNo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
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
                    toast.success(`📧 Email sent successfully to student for ${invalidDocs.length} invalid document(s)!`, {
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
              className={`px-6 py-3 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ${
                Object.values(docValidation).filter(v => v === false).length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
              }`}
            >
              <X className="w-5 h-5" />
              {saving ? 'Sending Email...' : `📧 Send Email for Invalid Docs (${Object.values(docValidation).filter(v => v === false).length})`}
            </button>

            {/* Save Verification Button */}
            <button
              onClick={handleSaveVerification}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold text-base shadow-lg hover:shadow-xl hover:from-green-700 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  💾 Save Verification
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

        {/* Eligibility Verified by Table */}
        <div className="mb-10">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Eligibility Verified by</h4>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full text-left divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">Signature</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b">
                  <td className="px-6 py-4 text-sm text-gray-800">{student.verified_by || student.verified_by_name || 'LC2101'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{(student.verified_date && new Date(student.verified_date).toLocaleDateString()) || (student.verification_date && new Date(student.verification_date).toLocaleDateString()) || 'N/A'}</td>
                  <td className="px-6 py-6 text-sm text-gray-800">&nbsp;</td>
                </tr>
              </tbody>
            </table>
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
    </div>
  );
};

export default StudentDetail;
