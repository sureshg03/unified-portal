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
  <base href="${window.location.origin}/">
  <title>Application Form - ${applicationData.application_id || ''}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 8mm 12mm;
      /* Remove default headers and footers in print */
      @top-left { content: none; }
      @top-center { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-center { content: none; }
      @bottom-right { content: none; }
    }

    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.2;
      color: #000;
      background: #fff;
      padding: 3mm;
    }

    .container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      position: relative;
    }

    /* Header Section - Left Aligned Professional Style */
    .header {
      border-bottom: 2px solid #8B008B;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .header-flex {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-start;
      padding-left: 15px;
      min-height: 75px;
    }

    .logo-section {
      flex: 0 0 auto;
    }

    .university-logo {
      width: 65px;
      height: 65px;
      object-fit: contain;
      display: block;
    }

    .university-details {
      flex: 1;
      text-align: left;
    }

    .university-name {
      font-size: 24pt;
      font-weight: 600;
      color: #8B008B;
      margin: 0 0 3px 0;
      line-height: 1.1;
    }

    .university-subtitle {
      font-size: 8.5pt;
      color: #333;
      margin: 1px 0;
      font-weight: 500;
      line-height: 1.3;
    }

    .university-address {
      font-size: 8.5pt;
      color: #333;
      font-weight: 700;
      margin: 1px 0 8px 0;
      line-height: 1.3;
    }

    .cdoe-title {
      color: #FF8C00;
      font-size: 14pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 4px 0 2px 0;
      line-height: 1.2;
    }

    .odl-subtitle {
      color: #FF8C00;
      font-size: 11pt;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }

    .main-title {
      font-size: 9pt;
      font-weight: 700;
      text-decoration: underline;
      margin: 5px 0 6px 0;
      color: #000;
      text-align: center;
      line-height: 1.2;
      page-break-after: avoid;
    }

    /* Application Info Box Table */
    .info-box-table {
      width: 100%;
      border: 1px solid #000000;
      border-collapse: collapse;
      margin-bottom: 8px;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .info-cell {
      padding: 6px 10px;
      font-size: 8.5pt;
      vertical-align: middle;
    }

    .info-label {
      font-weight: 700;
      color: #000000;
      font-size: 8pt;
      display: inline-block;
      min-width: 100px;
    }

    .info-value {
      color: #000000;
      font-weight: 600;
      font-size: 8pt;
      margin-left: 8px;
    }

    .photo-cell {
      width: 100px;
      padding: 6px;
      background: #ffffff;
    }

    /* Main Content Table */
    .content-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 8pt;
      border: 1px solid #000000;
    }

    .content-table td {
      border: 1px solid #000000;
      padding: 3px 5px;
      vertical-align: middle;
    }

    .content-table tr {
      page-break-inside: avoid;
    }

    .row-number {
      width: 25px;
      text-align: center;
      font-weight: 600;
      background: #e9ecef;
      color: #000000;
      font-size: 7.5pt;
    }

    .field-label {
      width: 160px;
      font-weight: 500;
      color: #000000;
      background: #f8f9fa;
      font-size: 7.5pt;
    }

    .field-separator {
      width: 10px;
      text-align: center;
      font-weight: 600;
      color: #000000;
    }

    .field-value {
      color: #000000;
      font-weight: 600;
      background: #ffffff;
      font-size: 7.5pt;
    }

    .view-link {
      color: #007bff;
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
      font-size: 7pt;
    }

    /* Section Headers */
    .section-header {
      background: #e9ecef;
      color: #000000;
      border: 1px solid #000000;
      padding: 4px 8px;
      font-weight: 700;
      margin-top: 6px;
      margin-bottom: 4px;
      font-size: 8.5pt;
      border-radius: 0px;
      letter-spacing: 0.3px;
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
      margin-bottom: 6px;
      font-size: 6.5pt;
      table-layout: fixed;
    }

    .education-table th,
    .education-table td {
      border: 1px solid #000000;
      padding: 2px 2px;
      text-align: center;
      vertical-align: middle;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .education-table th {
      background: #e9ecef;
      color: #000000;
      font-weight: 700;
      font-size: 6.5pt;
      padding: 3px 2px;
      border: 1px solid #000000;
    }

    .education-table td {
      color: #000000;
      font-weight: 500;
      font-size: 6.5pt;
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
      border: 1px solid #000000;
      padding: 6px;
      margin: 6px 0;
      background: #ffffff;
      border-radius: 0px;
      page-break-inside: avoid;
    }

    .payment-title {
      text-align: center;
      font-size: 9pt;
      font-weight: 700;
      margin-bottom: 5px;
      text-decoration: underline;
      color: #000000;
      letter-spacing: 0.3px;
    }

    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
      page-break-inside: avoid;
    }

    .payment-table td {
      border: 1px solid #000000;
      padding: 3px 5px;
      font-size: 7pt;
    }

    .payment-label {
      font-weight: 600;
      width: 120px;
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

    /* Declaration Section */
    .declaration-section {
      margin-top: 8px;
      padding: 8px 12px;
      border: 1px solid #000;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .declaration-title {
      font-size: 9pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 5px;
      color: #000;
      text-decoration: underline;
    }

    .declaration-text {
      font-size: 7.5pt;
      line-height: 1.3;
      text-align: justify;
      margin-bottom: 4px;
      color: #000;
    }

    .declaration-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
      padding-top: 5px;
    }

    .place-date {
      text-align: left;
    }

    .place-date p {
      font-size: 7.5pt;
      font-weight: 600;
      color: #000;
      margin-bottom: 5px;
    }

    /* Signature Section */
    .signature-section {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .signature-image-container {
      width: 150px;
      height: 40px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #000;
    }

    .signature-image-container img {
      max-width: 140px;
      max-height: 35px;
      object-fit: contain;
    }

    .signature-line {
      border-top: 1px solid #000;
      width: 150px;
      margin: 20px 0 4px 0;
    }

    .signature-label {
      font-weight: 600;
      font-size: 7.5pt;
      text-align: center;
      width: 150px;
      color: #000000;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      text-align: center;
      font-size: 9pt;
      border-top: 3px solid #3e066cff;
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

    /* Action Buttons */
    .action-buttons {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-print {
      background: #7401b6ff;
      color: white;
    }

    .btn-print:hover {
      background: #5a0190;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(116, 1, 182, 0.3);
    }

    .btn-back {
      background: #6c757d;
      color: white;
    }

    .btn-back:hover {
      background: #545b62;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
    }

    /* Print Styles */
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }

      .action-buttons {
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
  <!-- Action Buttons -->
  <div class="action-buttons no-print">
    <button class="btn btn-back" onclick="window.close()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
      </svg>
      Back
    </button>
    <button class="btn btn-print" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
        <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
      </svg>
      Print
    </button>
  </div>

  <div class="container">
    <!-- Header - Professional Left Aligned Style -->
    <div class="header">
      <div class="header-flex">
        <div class="logo-section">
          <img src="/Logo.png" 
               alt="Periyar University Logo" 
               class="university-logo"
               onerror="console.error('Logo failed to load'); this.onerror=null; this.style.visibility='hidden';">
        </div>
        <div class="university-details">
          <div class="university-name">Periyar University</div>
          <div class="university-subtitle">State University - NAAC 'A++' Grade - NIRF Rank 94</div>
          <div class="university-subtitle">State Public University Rank 40 - SDG Institutions Rank Band: 11-50</div>
          <div class="university-address">Salem-636011, Tamilnadu, India</div>
          <div class="cdoe-title">CENTRE FOR DISTANCE AND ONLINE EDUCATION (CDOE)</div>
          <div class="odl-subtitle">Open and Distance Learning</div>
        </div>
      </div>
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
            // Get institution name - primary field is institute_name
            const institution = qual.institute_name || qual.institution || qual.board_university || 'N/A';
            
            // Get subjects - primary field is subject_studied (singular)
            let subjects = '';
            try {
              // Check primary field first: subject_studied
              const subjectField = qual.subject_studied || qual.subjects_studied || qual.subjects || qual.subjectsstudied || '';
              
              if (typeof subjectField === 'string') {
                // Try to parse as JSON first
                try {
                  const parsed = JSON.parse(subjectField);
                  subjects = Array.isArray(parsed) ? parsed.join(', ') : subjectField;
                } catch {
                  // Not JSON, use as is
                  subjects = subjectField;
                }
              } else if (Array.isArray(subjectField)) {
                subjects = subjectField.join(', ');
              } else {
                subjects = subjectField;
              }
            } catch (e) {
              subjects = qual.subject_studied || qual.subjects_studied || qual.subjects || '';
            }
            
            // If subjects is still empty, show placeholder
            if (!subjects || subjects.trim() === '') {
              subjects = 'Not Specified';
            }
            
            // Get register number - primary field is reg_no
            const registerNo = qual.reg_no || qual.register_no || qual.register_number || qual.registration_no || qual.registerno || qual.regno || 'N/A';
            
            // Parse month_year if it contains both month and year (e.g., "03/2025")
            let monthOfPassing = '';
            let yearOfPassing = '';
            
            // Primary field is month_year
            if (qual.month_year || qual.month_year_of_passing || qual.monthyearofpassing) {
              const monthYear = qual.month_year || qual.month_year_of_passing || qual.monthyearofpassing;
              if (typeof monthYear === 'string' && monthYear.includes('/')) {
                const parts = monthYear.split('/');
                if (parts.length === 2) {
                  monthOfPassing = parts[0]; // Month (e.g., "03")
                  yearOfPassing = parts[1];  // Year (e.g., "2025")
                }
              } else {
                monthOfPassing = monthYear;
              }
            } else {
              // Fallback to separate fields
              monthOfPassing = qual.month_of_passing || qual.month || '';
              yearOfPassing = qual.year_of_passing || qual.year || '';
            }
            
            // Convert month number to name if needed
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (monthOfPassing && !isNaN(monthOfPassing)) {
              const monthNum = parseInt(monthOfPassing);
              if (monthNum >= 1 && monthNum <= 12) {
                monthOfPassing = monthNames[monthNum - 1];
              }
            }
            
            return `
            <tr>
              <td>${qual.course || qual.exam_passed || 'N/A'}</td>
              <td>${institution}</td>
              <td>${qual.board || qual.university || 'N/A'}</td>
              <td>${subjects}</td>
              <td>${registerNo}</td>
              <td>${qual.percentage || 'N/A'}</td>
              <td>${monthOfPassing || 'N/A'}</td>
              <td>${yearOfPassing || 'N/A'}</td>
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

    <!-- Declaration Section -->
    <div class="declaration-section">
      <div class="declaration-title">DECLARATION</div>
      
      <p class="declaration-text">
        I hereby declare that all the information provided in this application form is true and correct to the best of my knowledge and belief.
        I understand that any false or misleading information may result in the rejection of my application or cancellation of my admission.
        I have carefully reviewed all the details mentioned above and confirm their accuracy.
      </p>
      
      <p class="declaration-text">
        I agree to abide by all the rules and regulations of the Centre for Distance and Online Education (CDOE), Periyar University,
        and understand that the university reserves the right to verify any information provided in this application.
      </p>

      <div class="declaration-footer">
        <div class="place-date">
          <p>Place: _________________</p>
          <p>Date: _________________</p>
        </div>

        <div class="signature-section">
          ${signatureUrl ? `
            <div class="signature-image-container">
              <img src="http://127.0.0.1:8000${signatureUrl}" 
                   alt="Applicant Signature"
                   onerror="this.onerror=null; this.style.display='none';">
            </div>
          ` : '<div class="signature-line"></div>'}
          <div class="signature-label">Applicant's Signature</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      © <a href="https://pride.periyaruniversity.ac.in/vodlRegistedCDOE/download/pdfwithout.php?ke=A25DSW21010001" class="footer-link">Periyar University, Salem.</a> All Right Reserved.
    </div>
  </div>

  <script>
    // Optional: Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + P to print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
      // Escape to close
      if (e.key === 'Escape') {
        window.close();
      }
    });
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
