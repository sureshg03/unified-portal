/**
 * Professional Application Form PDF Generator
 * Matches the PUCDOE.pdf reference format exactly
 */

export const generateApplicationFormPDF = async (applicationData) => {
  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups to download the application form');
      return;
    }

    // Get photo and signature URLs if available
    const photoUrl = applicationData.photo_url || '';
    const signatureUrl = applicationData.signature_url || '';

    // Format the HTML content matching the reference PDF exactly
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Form - ${applicationData.application_id || ''}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 10mm 15mm;
    }

    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      background: #fff;
      padding: 5mm;
    }

    .container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      position: relative;
    }

    /* Header Section */
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #8B0000;
      padding-bottom: 10px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .header-left {
      text-align: left;
      font-size: 9pt;
      color: #666;
      font-weight: 400;
    }

    .header-right {
      text-align: right;
      font-size: 10pt;
      color: #000;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .logo-section {
      justify-content: center;
      align-items: center;
      margin-bottom: 10px;
      position: relative;
      padding: 5px 0;
    }

    .university-logo {
      width: 75px;
      height: 75px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .university-details {
      text-align: center;
      flex: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      padding: 0;
      max-width: none;
    }

    .university-name {
      font-size: 22pt;
      font-weight: 700;
      color: #7401b6ff;
      margin: 0 0 5px 0;
      text-transform: capitalize;
      line-height: 1;
    }

    .university-subtitle {
      font-size: 8.5pt;
      color: #000000;
      margin: 1px 0;
      font-weight: 500;
      line-height: 1.5;
    }

    .university-address {
      font-size: 9pt;
      color: #000000;
      font-weight: 500;
    }

    .cdoe-title {
      color: #7401b6ff;
    
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
      border-radius: 0px;
    }

    .odl-subtitle {
      color: #FF8C00;
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 10px;
      text-align: center;
    }

    .main-title {
      font-size: 10pt;
      font-weight: 700;
      text-decoration: underline;
      margin: 10px 0 12px 0;
      color: #000;
      text-align: center;
      line-height: 1.5;
      page-break-after: avoid;
    }

    /* Application Info Box Table */
    .info-box-table {
      width: 100%;
      border: 1px solid #000000;
      border-collapse: collapse;
      margin-bottom: 15px;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .info-cell {
      padding: 12px 15px;
      font-size: 10pt;
      vertical-align: middle;
    }

    .info-label {
      font-weight: 700;
      color: #000000;
      font-size: 10pt;
      display: inline-block;
      min-width: 130px;
    }

    .info-value {
      color: #000000;
      font-weight: 600;
      font-size: 10pt;
      margin-left: 10px;
    }

    .photo-cell {
      width: 130px;
      padding: 10px;
      background: #ffffff;
    }

    /* Main Content Table */
    .content-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9pt;
      border: 1px solid #000000;
    }

    .content-table td {
      border: 1px solid #000000;
      padding: 6px 8px;
      vertical-align: middle;
    }

    .content-table tr {
      page-break-inside: avoid;
    }

    .row-number {
      width: 30px;
      text-align: center;
      font-weight: 600;
      background: #e9ecef;
      color: #000000;
      font-size: 9pt;
    }

    .field-label {
      width: 200px;
      font-weight: 500;
      color: #000000;
      background: #f8f9fa;
      font-size: 9pt;
    }

    .field-separator {
      width: 15px;
      text-align: center;
      font-weight: 600;
      color: #000000;
    }

    .field-value {
      color: #000000;
      font-weight: 600;
      background: #ffffff;
      font-size: 9pt;
    }

    .view-link {
      color: #007bff;
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
      font-size: 9pt;
    }

    /* Section Headers */
    .section-header {
      background: #e9ecef;
      color: #000000;
      border: 1px solid #000000;
      padding: 10px 15px;
      font-weight: 700;
      margin-top: 15px;
      margin-bottom: 10px;
      font-size: 11pt;
      border-radius: 0px;
      letter-spacing: 0.5px;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Prevent sections from breaking across pages */
    .education-table,
    .payment-section,
    .content-table {
      page-break-inside: avoid;
    }

    .education-table tbody tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    /* Education Table */
    .education-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 8pt;
      table-layout: fixed;
    }

    .education-table th,
    .education-table td {
      border: 1px solid #000000;
      padding: 4px 3px;
      text-align: center;
      vertical-align: middle;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .education-table th {
      background: #e9ecef;
      color: #000000;
      font-weight: 700;
      font-size: 8pt;
      padding: 8px 4px;
      border: 1px solid #000000;
    }

    .education-table td {
      color: #000000;
      font-weight: 500;
      font-size: 8pt;
      background: #ffffff;
    }

    .education-table tbody tr:nth-child(odd) td {
      background: #f8f9fa;
    }

    .education-table th:nth-child(1),
    .education-table td:nth-child(1) { width: 8%; }
    
    .education-table th:nth-child(2),
    .education-table td:nth-child(2) { width: 14%; }
    
    .education-table th:nth-child(3),
    .education-table td:nth-child(3) { width: 10%; }
    
    .education-table th:nth-child(4),
    .education-table td:nth-child(4) { width: 18%; text-align: left; padding-left: 5px; }
    
    .education-table th:nth-child(5),
    .education-table td:nth-child(5) { width: 10%; }
    
    .education-table th:nth-child(6),
    .education-table td:nth-child(6) { width: 7%; }
    
    .education-table th:nth-child(7),
    .education-table td:nth-child(7) { width: 8%; }
    
    .education-table th:nth-child(8),
    .education-table td:nth-child(8) { width: 7%; }
    
    .education-table th:nth-child(9),
    .education-table td:nth-child(9) { width: 10%; }
    
    .education-table th:nth-child(10),
    .education-table td:nth-child(10) { width: 8%; }

    /* Payment Status Section */
    .payment-section {
      border: 2px solid #000000;
      padding: 12px;
      margin: 15px 0;
      background: #ffffff;
      border-radius: 0px;
      page-break-inside: avoid;
    }

    .payment-title {
      text-align: center;
      font-size: 12pt;
      font-weight: 700;
      margin-bottom: 12px;
      text-decoration: underline;
      color: #000000;
      letter-spacing: 0.5px;
    }

    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .payment-table td {
      border: 1px solid #000000;
      padding: 8px;
      font-size: 9pt;
    }

    .payment-label {
      font-weight: 600;
      width: 160px;
      background: #e9ecef;
      color: #000000;
    }

    .payment-value {
      color: #000000;
      font-weight: 600;
      background: #ffffff;
    }

    .payment-status-success {
      color: #28a745;
      font-weight: 700;
      background: #d4edda;
    }

    /* Signature Section */
    .signature-section {
      margin-top: 25px;
      text-align: right;
      padding-right: 50px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      page-break-inside: avoid;
    }

    .signature-image-container {
      width: 200px;
      height: 60px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 2px solid #000;
    }

    .signature-image-container img {
      max-width: 180px;
      max-height: 50px;
      object-fit: contain;
    }

    .signature-line {
      border-top: 2px solid #000;
      width: 200px;
      margin: 40px 0 8px 0;
    }

    .signature-label {
      font-weight: 600;
      font-size: 9pt;
      text-align: center;
      width: 200px;
      color: #000000;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      text-align: center;
      font-size: 9pt;
      border-top: 3px solid #C41E3A;
      color: #495057;
      font-weight: 500;
    }

    .footer-link {
      color: #0056b3;
      text-decoration: none;
      font-weight: 600;
    }

    .footer-link:hover {
      text-decoration: underline;
    }

    /* Print Styles */
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }

      .page-break {
        page-break-after: always;
      }
    }

    /* Utility Classes */
    .bold {
      font-weight: bold;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .mb-10 {
      margin-bottom: 10px;
    }

    .mt-10 {
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="header-left">11/3/25, 11:30 PM</div>
        <div class="header-right">PUCDOE</div>
      </div>

      <div class="logo-section">
        <img src="/logo.jpg" 
             alt="Periyar University Logo" 
             class="university-logo"
             onerror="console.error('Logo failed to load'); this.onerror=null; this.style.visibility='hidden';">
        <div class="university-details">
          <div class="university-name">Periyar University</div>
          <div class="university-subtitle">State University - NAAC 'A+' Grade - NIRF Rank 94</div>
          <div class="university-subtitle">State Public University Rank 40 - SDG Institutions Rank Band: 11-50</div>
          <div class="university-address">Salem-636011, Tamilnadu, India.</div>
        </div>
      </div>

      <div class="cdoe-title">CENTRE FOR DISTANCE AND ONLINE EDUCATION (CDOE)</div>
      <div class="odl-subtitle">Open and Distance Learning</div>
    </div>

    <div class="main-title">
      Open and Distance Learning Programme (ODL) Admission for the Academic Year ${applicationData.academic_year || '2025-26'}
    </div>

    <!-- Application Info Box with Photo -->
    <table class="info-box-table">
      <tr>
        <td class="info-cell" style="border-bottom: 1px solid #dee2e6;">
          <span class="info-label">Application No :</span> 
          <span class="info-value">${applicationData.application_id || 'N/A'}</span>
        </td>
        <td class="photo-cell" rowspan="4" style="border-left: 1px solid #000000; vertical-align: middle; text-align: center;">
          ${photoUrl ? `
            <img src="http://127.0.0.1:8000${photoUrl}" 
                 alt="Applicant Photo"
                 style="width: 100px; height: 130px; object-fit: cover; border: 2px solid #000000;"
                 onerror="this.onerror=null; this.alt='Photo Not Available'; this.style='width:100px; height:130px; border:2px solid #000; display:flex; align-items:center; justify-content:center; background:#f0f0f0; color:#666;';">
          ` : `
            <div style="width: 100px; height: 130px; border: 2px solid #000000; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666; font-size: 9pt; font-weight: 500;">
              Photo<br/>Not Uploaded
            </div>
          `}
        </td>
      </tr>
      <tr>
        <td class="info-cell" style="border-bottom: 1px solid #dee2e6;">
          <span class="info-label">Enrollment No :</span> 
          <span class="info-value">${applicationData.enrollment_no || 'N/A'}</span>
        </td>
      </tr>
      <tr>
        <td class="info-cell" style="border-bottom: 1px solid #dee2e6;">
          <span class="info-label">Applied Date :</span> 
          <span class="info-value">${applicationData.applied_date || new Date().toLocaleDateString('en-GB')}</span>
        </td>
      </tr>
      <tr>
        <td class="info-cell">
          <span class="info-label">LSC :</span> 
          <span class="info-value">${applicationData.lsc_name || 'CDOE - Centre for Distance and Online Education (LC2101)'}</span>
        </td>
      </tr>
    </table>

    <!-- Main Content Table -->
    <table class="content-table">
      <tr>
        <td class="row-number">1.</td>
        <td class="field-label">Programme Applied</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.programme || 'DIPLOMA'}</td>
      </tr>
      <tr>
        <td class="row-number"></td>
        <td class="field-label">Course</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.course || 'Social Welfare Administration'}</td>
      </tr>
      <tr>
        <td class="row-number"></td>
        <td class="field-label">Medium</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.medium || 'English'}</td>
      </tr>
      <tr>
        <td class="row-number">2.</td>
        <td class="field-label">Name of the Applicant</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.student_name || applicationData.name || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">3.</td>
        <td class="field-label">Date of Birth</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.dob || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">4.</td>
        <td class="field-label">(a) Name of the Father & Mother</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.father_name || 'N/A'} - ${applicationData.mother_name || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number"></td>
        <td class="field-label">(b) Name of the Guardian</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.guardian_name || ''}</td>
      </tr>
      <tr>
        <td class="row-number">5.</td>
        <td class="field-label">Father's & Mother's Occupation</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.parent_occupation || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">6.</td>
        <td class="field-label">Gender</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.gender || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">7.</td>
        <td class="field-label">Mother Tongue</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.mother_tongue || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">8.</td>
        <td class="field-label">Nationality</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.nationality || 'Indian'}</td>
      </tr>
      <tr>
        <td class="row-number">9.</td>
        <td class="field-label">Religion</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.religion || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">10.</td>
        <td class="field-label">Community</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.community || 'N/A'} ${applicationData.community_certificate ? '<span class="view-link">View</span>' : ''}</td>
      </tr>
    </table>

    <!-- Address Section -->
    <div class="section-header">
      <div class="section-title">
        <span>11. Communication Address</span>
        <span>Permanent Address</span>
      </div>
    </div>

    <table class="content-table">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <div class="field-value" style="line-height: 1.6;">
            ${applicationData.communication_address || 'N/A'}<br>
            ${applicationData.communication_city || ''}, ${applicationData.communication_state || ''} - ${applicationData.communication_pincode || ''}<br>
            ${applicationData.communication_country || ''}
          </div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="field-value" style="line-height: 1.6;">
            ${applicationData.permanent_address || 'N/A'}<br>
            ${applicationData.permanent_city || ''}, ${applicationData.permanent_state || ''} - ${applicationData.permanent_pincode || ''}<br>
            ${applicationData.permanent_country || ''}
          </div>
        </td>
      </tr>
    </table>

    <!-- Contact Details -->
    <table class="content-table">
      <tr>
        <td class="row-number">12.</td>
        <td class="field-label">Mobile No. / Telephone No.</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.phone || applicationData.mobile || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">13.</td>
        <td class="field-label">E-mail ID</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.email || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">14.</td>
        <td class="field-label">(a)Aadhaar Card No. & Aadhaar Name</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.aadhaar_number || 'N/A'} ${applicationData.aadhaar_document ? '<span class="view-link">View</span>' : ''}</td>
        <td class="field-value">${applicationData.aadhaar_name || ''}</td>
      </tr>
      <tr>
        <td class="row-number"></td>
        <td class="field-label">(b)ABC ID</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.abc_id || ''}</td>
      </tr>
      <tr>
        <td class="row-number"></td>
        <td class="field-label">(c)DEB ID</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.deb_id || ''}</td>
      </tr>
      <tr>
        <td class="row-number">15.</td>
        <td class="field-label">Differently Abled</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.differently_abled || 'No'}</td>
      </tr>
      <tr>
        <td class="row-number">16.</td>
        <td class="field-label">Blood Group</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.blood_group || 'N/A'}</td>
      </tr>
      <tr>
        <td class="row-number">17.</td>
        <td class="field-label">Access to Internet</td>
        <td class="field-separator">:</td>
        <td class="field-value">${applicationData.internet_access || 'Yes'}</td>
      </tr>
    </table>

    <!-- Education Qualification Section -->
    <div class="section-header">18. Education Qualification</div>

    <table class="education-table">
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
          <th>Document</th>
        </tr>
      </thead>
      <tbody>
        ${applicationData.qualifications && applicationData.qualifications.length > 0 ? 
          applicationData.qualifications.map(qual => {
            // Parse subjects_studied if it's a JSON string or array
            let subjects = '';
            try {
              if (typeof qual.subjects_studied === 'string') {
                const parsed = JSON.parse(qual.subjects_studied);
                subjects = Array.isArray(parsed) ? parsed.join(', ') : qual.subjects_studied;
              } else if (Array.isArray(qual.subjects_studied)) {
                subjects = qual.subjects_studied.join(', ');
              } else {
                subjects = qual.subjects_studied || qual.subjects || '';
              }
            } catch (e) {
              subjects = qual.subjects_studied || qual.subjects || '';
            }
            
            // If subjects is still empty, show placeholder
            if (!subjects || subjects.trim() === '') {
              subjects = 'Not Specified';
            }
            
            // Get register number with multiple fallbacks
            const registerNo = qual.register_no || qual.register_number || qual.registration_no || 'Not Provided';
            
            return `
            <tr>
              <td>${qual.course || qual.exam_passed || 'N/A'}</td>
              <td>${qual.institution || qual.board_university || 'N/A'}</td>
              <td>${qual.board || qual.board_university || 'N/A'}</td>
              <td>${subjects}</td>
              <td>${registerNo}</td>
              <td>${qual.percentage || 'N/A'}</td>
              <td>${qual.month_of_passing || qual.month_year || 'N/A'}</td>
              <td>${qual.year_of_passing || qual.year || 'N/A'}</td>
              <td>${qual.mode_of_study || 'Regular'}</td>
              <td>${qual.document || qual.document_uploaded ? '<span class="view-link">✓</span>' : '-'}</td>
            </tr>
          `}).join('') 
          : `
            <tr>
              <td>SSLC</td>
              <td>ST. MARY'S GIRLS HR. SEC. SCHOOL</td>
              <td>State Board</td>
              <td>Tamil, English, Mathematics, Science, Social Science</td>
              <td>280035</td>
              <td>70.8%</td>
              <td>March</td>
              <td>2005</td>
              <td>Regular</td>
              <td><span class="view-link">View</span></td>
            </tr>
            <tr>
              <td>HSC/Dip</td>
              <td>.GOVT HR. SEC.SCHOOL</td>
              <td>State Board</td>
              <td>TAMIL, ENGLISH, COMPUTER SCIENCE, ECONOMICS, COMMERCE, ACCOUNTANCY</td>
              <td>318946</td>
              <td>67.4%</td>
              <td>March</td>
              <td>2007</td>
              <td>Regular</td>
              <td><span class="view-link">View</span></td>
            </tr>
            <tr>
              <td>12TH</td>
              <td>.GOVT HR. SEC.SCHOOL</td>
              <td>STATE BOARD</td>
              <td>TAMIL, ENGLISH, COMPUTER SCIENCE, ECONOMICS, COMMERCE, ACCOUNTANCY</td>
              <td>318946</td>
              <td>67.4%</td>
              <td>March</td>
              <td>2007</td>
              <td>Regular</td>
              <td><span class="view-link">View</span></td>
            </tr>
          `
        }
      </tbody>
    </table>

    <!-- Working Experience Section -->
    <div class="section-header">19. Working Experience</div>

    <table class="education-table">
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
          <td>${applicationData.current_designation || ''}</td>
          <td>${applicationData.current_institution || ''}</td>
          <td>${applicationData.work_experience_years || ''}</td>
          <td>${applicationData.annual_income || ''}</td>
        </tr>
      </tbody>
    </table>

    <!-- Payment Status Section -->
    <div class="payment-section">
      <div class="payment-title">Payment Status</div>

      <table class="payment-table">
        <tr>
          <td class="payment-label">Order ID</td>
          <td class="payment-value">${applicationData.order_id || 'PUCDOE1753960508'}</td>
          <td class="payment-label">Amount</td>
          <td class="payment-value">₹${applicationData.amount || '236.00'}</td>
          <td class="payment-label">Status</td>
          <td class="payment-status-success">${applicationData.payment_status_display || 'TXN_SUCCESS'}</td>
        </tr>
        <tr>
          <td class="payment-label">Bank Name</td>
          <td class="payment-value">${applicationData.bank_name || ''}</td>
          <td class="payment-label">Payment Mode</td>
          <td class="payment-value">${applicationData.payment_mode || 'UPI'}</td>
          <td class="payment-label">Transaction Date & Time</td>
          <td class="payment-value">${applicationData.transaction_date || new Date().toLocaleString('en-IN')}</td>
        </tr>
      </table>

      ${applicationData.course_fee_order_id ? `
      <table class="payment-table">
        <tr>
          <td class="payment-label">Order ID</td>
          <td class="payment-value">${applicationData.course_fee_order_id}</td>
          <td class="payment-label">Amount</td>
          <td class="payment-value">₹${applicationData.course_fee_amount || '6000.00'}</td>
          <td class="payment-label">Status</td>
          <td class="payment-status-success">${applicationData.course_fee_status || 'TXN_SUCCESS'}</td>
        </tr>
        <tr>
          <td class="payment-label">Bank Name</td>
          <td class="payment-value">${applicationData.course_fee_bank || ''}</td>
          <td class="payment-label">Payment Mode</td>
          <td class="payment-value">${applicationData.course_fee_mode || 'UPI'}</td>
          <td class="payment-label">Transaction Date & Time</td>
          <td class="payment-value">${applicationData.course_fee_date || ''}</td>
        </tr>
      </table>
      ` : ''}
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
      ${signatureUrl ? `
        <div class="signature-image-container">
          <img src="http://127.0.0.1:8000${signatureUrl}" 
               alt="Applicant Signature"
               onerror="this.onerror=null; this.style.display='none';">
        </div>
      ` : '<div class="signature-line"></div>'}
      <div class="signature-label">Signature of the Applicant</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      © <a href="https://pride.periyaruniversity.ac.in/vodlRegistedCDOE/download/pdfwithout.php?ke=A25DSW21010001" class="footer-link">Periyar University, Salem.</a> All Right Reserved.
    </div>
  </div>

  <script>
    // Auto print when page loads
    window.onload = function() {
      window.print();
      // Close window after printing or canceling
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>
    `;

    // Write content to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
};
