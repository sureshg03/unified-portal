/**
 * Professional Application PDF Generator
 * Matches the exact format and layout of PUCDOE reference PDF
 * Includes all sections with proper formatting, borders, and styling
 */

export const generateProfessionalApplicationPDF = (data, mode = 'preview') => {
  // Helper function to format qualifications table
  const formatQualificationsTable = (qualifications) => {
    if (!qualifications || qualifications.length === 0) {
      return `
        <tr>
          <td colspan="10" style="text-align: center; padding: 15px; color: #666; font-size: 11px;">
            No educational qualification data available
          </td>
        </tr>`;
    }
    
    return qualifications.map((qual, index) => {
      // Parse subjects_studied if it's a JSON string or array
      let subjects = '';
      try {
        if (typeof qual.subjects_studied === 'string') {
          const parsed = JSON.parse(qual.subjects_studied);
          subjects = Array.isArray(parsed) ? parsed.join(', ') : qual.subjects_studied;
        } else if (Array.isArray(qual.subjects_studied)) {
          subjects = qual.subjects_studied.join(', ');
        } else {
          subjects = qual.subjects_studied || '';
        }
      } catch (e) {
        subjects = qual.subjects_studied || '';
      }
      
      // If subjects is still empty, show placeholder
      if (!subjects || subjects.trim() === '') {
        subjects = 'Not Specified';
      }
      
      // Get register number with multiple fallbacks
      const registerNo = qual.register_no || qual.register_number || qual.registration_no || 'Not Provided';
      
      return `
      <tr>
        <td style="text-align: center; font-size: 10px;">${qual.course || qual.exam_passed || '-'}</td>
        <td style="font-size: 10px;">${qual.institution || qual.board_university || '-'}</td>
        <td style="font-size: 10px;">${qual.board || qual.board_university || '-'}</td>
        <td style="font-size: 10px;">${subjects}</td>
        <td style="text-align: center; font-size: 10px;">${registerNo}</td>
        <td style="text-align: center; font-size: 10px;">${qual.percentage || '-'}</td>
        <td style="text-align: center; font-size: 10px;">${qual.month_of_passing || qual.month_year || '-'}</td>
        <td style="text-align: center; font-size: 10px;">${qual.year_of_passing || qual.year || '-'}</td>
        <td style="text-align: center; font-size: 10px;">${qual.mode_of_study || 'Regular'}</td>
        <td style="text-align: center; font-size: 10px;">${qual.document_uploaded ? '✓' : '-'}</td>
      </tr>
    `}).join('');
  };

  // Helper function to format address
  const formatAddress = (data, type) => {
    const prefix = type === 'comm' ? 'comm' : 'perm';
    const area = data[`${prefix}_area`] || '';
    const town = data[`${prefix}_town`] || '';
    const district = data[`${prefix}_district`] || '';
    const state = data[`${prefix}_state`] || '';
    const country = data[`${prefix}_country`] || '';
    const pincode = data[`${prefix}_pincode`] || '';
    
    const parts = [area, town, district, state, country, pincode].filter(p => p);
    return parts.length > 0 ? parts.join(', ') : 'Not Provided';
  };

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <base href="${window.location.origin}/">
      <title>Application Form - ${data.application_id || 'Draft'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: A4;
          margin: 10mm 15mm;
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
          border-bottom: 2px solid #3e066cff;
          padding-bottom: 10px;
          background: #f9f9f9;
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
          background: #7c3aed;
          color: white;
        }

        .btn-print:hover {
          background: #6d28d9;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
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
        <!-- Header -->
        <div class="header">
          <div class="header-top">
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
          Open and Distance Learning Programme (ODL) Admission for the Academic Year ${data.academic_year || '2025-26'}
        </div>

        <!-- Application Info Box with Photo -->
        <table class="info-box-table">
          <tr>
            <td class="info-cell" style="border-bottom: 1px solid #dee2e6;">
              <span class="info-label">Application No :</span> 
              <span class="info-value">${data.application_id || 'N/A'}</span>
            </td>
            <td class="photo-cell" rowspan="4" style="border-left: 1px solid #000000; vertical-align: middle; text-align: center;">
              ${data.photo_url ? `
                <img src="http://127.0.0.1:8000${data.photo_url}" 
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
              <span class="info-value">${data.enrollment_no || 'N/A'}</span>
            </td>
          </tr>
          <tr>
            <td class="info-cell" style="border-bottom: 1px solid #dee2e6;">
              <span class="info-label">Applied Date :</span> 
              <span class="info-value">${data.applied_date || new Date().toLocaleDateString('en-GB')}</span>
            </td>
          </tr>
          <tr>
            <td class="info-cell">
              <span class="info-label">LSC :</span> 
              <span class="info-value">${data.lsc_name || 'CDOE - Centre for Distance and Online Education (LC2101)'}</span>
            </td>
          </tr>
        </table>


        <!-- Main Content Table -->
        <table class="content-table">
          <tr>
            <td class="row-number">1.</td>
            <td class="field-label">Programme Applied</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.programme || data.programme_applied || 'DIPLOMA'}</td>
          </tr>
          <tr>
            <td class="row-number"></td>
            <td class="field-label">Course</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.course || 'Social Welfare Administration'}</td>
          </tr>
          <tr>
            <td class="row-number"></td>
            <td class="field-label">Medium</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.medium || 'English'}</td>
          </tr>
          <tr>
            <td class="row-number">2.</td>
            <td class="field-label">Name of the Applicant</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.student_name || data.name || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">3.</td>
            <td class="field-label">Date of Birth</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.dob || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">4.</td>
            <td class="field-label">(a) Name of the Father & Mother</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.father_name || 'N/A'} - ${data.mother_name || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number"></td>
            <td class="field-label">(b) Name of the Guardian</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.guardian_name || ''}</td>
          </tr>
          <tr>
            <td class="row-number">5.</td>
            <td class="field-label">Father's & Mother's Occupation</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.parent_occupation || data.father_occupation || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">6.</td>
            <td class="field-label">Gender</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.gender || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">7.</td>
            <td class="field-label">Mother Tongue</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.mother_tongue || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">8.</td>
            <td class="field-label">Nationality</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.nationality || 'Indian'}</td>
          </tr>
          <tr>
            <td class="row-number">9.</td>
            <td class="field-label">Religion</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.religion || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">10.</td>
            <td class="field-label">Community</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.community || 'N/A'} ${data.community_certificate ? '<span class="view-link">View</span>' : ''}</td>
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
                ${data.communication_address || data.comm_area || 'N/A'}<br>
                ${data.communication_city || data.comm_town || ''}, ${data.communication_state || data.comm_state || ''} - ${data.communication_pincode || data.comm_pincode || ''}<br>
                ${data.communication_country || data.comm_country || ''}
              </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
              <div class="field-value" style="line-height: 1.6;">
                ${data.permanent_address || data.perm_area || 'N/A'}<br>
                ${data.permanent_city || data.perm_town || ''}, ${data.permanent_state || data.perm_state || ''} - ${data.permanent_pincode || data.perm_pincode || ''}<br>
                ${data.permanent_country || data.perm_country || ''}
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
            <td class="field-value">${data.phone || data.mobile || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">13.</td>
            <td class="field-label">E-mail ID</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.email || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">14.</td>
            <td class="field-label">(a)Aadhaar Card No. & Aadhaar Name</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.aadhaar_number || data.aadhaar_no || 'N/A'} ${data.aadhaar_document ? '<span class="view-link">View</span>' : ''}</td>
            <td class="field-value">${data.aadhaar_name || data.name_as_aadhaar || ''}</td>
          </tr>
          <tr>
            <td class="row-number"></td>
            <td class="field-label">(b)ABC ID</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.abc_id || ''}</td>
          </tr>
          <tr>
            <td class="row-number"></td>
            <td class="field-label">(c)DEB ID</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.deb_id || ''}</td>
          </tr>
          <tr>
            <td class="row-number">15.</td>
            <td class="field-label">Differently Abled</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.differently_abled || 'No'}</td>
          </tr>
          <tr>
            <td class="row-number">16.</td>
            <td class="field-label">Blood Group</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.blood_group || 'N/A'}</td>
          </tr>
          <tr>
            <td class="row-number">17.</td>
            <td class="field-label">Access to Internet</td>
            <td class="field-separator">:</td>
            <td class="field-value">${data.internet_access || data.access_internet || 'Yes'}</td>
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
            ${data.qualifications && data.qualifications.length > 0 ? 
              data.qualifications.map(qual => {
                // Get institution name
                const institution = qual.institute_name || qual.institution || qual.board_university || 'N/A';
                
                // Get subjects
                let subjects = '';
                try {
                  const subjectField = qual.subject_studied || qual.subjects_studied || qual.subjects || '';
                  
                  if (typeof subjectField === 'string') {
                    try {
                      const parsed = JSON.parse(subjectField);
                      subjects = Array.isArray(parsed) ? parsed.join(', ') : subjectField;
                    } catch {
                      subjects = subjectField;
                    }
                  } else if (Array.isArray(subjectField)) {
                    subjects = subjectField.join(', ');
                  } else {
                    subjects = subjectField;
                  }
                } catch (e) {
                  subjects = qual.subject_studied || qual.subjects_studied || '';
                }
                
                if (!subjects || subjects.trim() === '') {
                  subjects = 'Not Specified';
                }
                
                // Get register number
                const registerNo = qual.reg_no || qual.register_no || qual.register_number || qual.registration_no || 'N/A';
                
                // Parse month_year
                let monthOfPassing = '';
                let yearOfPassing = '';
                
                if (qual.month_year || qual.month_year_of_passing) {
                  const monthYear = qual.month_year || qual.month_year_of_passing;
                  if (typeof monthYear === 'string' && monthYear.includes('/')) {
                    const parts = monthYear.split('/');
                    if (parts.length === 2) {
                      monthOfPassing = parts[0];
                      yearOfPassing = parts[1];
                    }
                  } else {
                    monthOfPassing = monthYear;
                  }
                } else {
                  monthOfPassing = qual.month_of_passing || qual.month || '';
                  yearOfPassing = qual.year_of_passing || qual.year || '';
                }
                
                // Convert month number to name
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
                  <td colspan="10" style="text-align: center; padding: 15px; color: #666;">
                    No educational qualification data available
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>

        
        <!-- Working Experience Section -->
        <div class="section-header">19. Working Experience (If Any)</div>

        <table class="education-table">
          <thead>
            <tr>
              <th style="width: 30%;">Working Status</th>
              <th style="width: 35%;">Organization</th>
              <th style="width: 20%;">Designation</th>
              <th style="width: 15%;">Years of Experience</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${data.current_designation || data.work_exp ? 'Yes' : 'No'}</td>
              <td>${data.current_institute || data.work_org || 'N/A'}</td>
              <td>${data.current_designation || data.work_des || 'N/A'}</td>
              <td>${data.years_experience || data.years_of_experience || 'N/A'}</td>
            </tr>
          </tbody>
        </table>


        <!-- Payment Section -->
        <div class="payment-section">
          <h3 class="payment-title">Application Fee Payment Details</h3>
          
          <table class="payment-table">
            <tr>
              <td class="payment-label">Order ID</td>
              <td class="payment-value">${data.order_id || 'N/A'}</td>
              <td class="payment-label">Amount</td>
              <td class="payment-value">₹ ${data.amount || '236.00'}</td>
              <td class="payment-label">Status</td>
              <td class="payment-value">
                <span class="payment-status-success">${data.payment_status === 'Paid' || data.payment_status === 'P' ? 'Paid' : 'Pending'}</span>
              </td>
            </tr>
            <tr>
              <td class="payment-label">Bank Ref. No.</td>
              <td class="payment-value">${data.transaction_id || data.bank_ref_no || 'N/A'}</td>
              <td class="payment-label">Payment Mode</td>
              <td class="payment-value">${data.payment_mode || data.payment_method || 'Online'}</td>
              <td class="payment-label">Date</td>
              <td class="payment-value">${data.transaction_date || data.payment_date || new Date().toLocaleDateString('en-IN')}</td>
            </tr>
          </table>
        </div>


        <!-- Declaration -->
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #000000; background: #ffffff;">
          <h3 style="text-align: center; color: #7401b6ff; margin: 0 0 10px 0; font-size: 11pt; font-weight: 600; text-decoration: underline;">Declaration</h3>
          <p style="font-size: 9pt; line-height: 1.4; text-align: justify; margin: 8px 0;">
            I hereby declare that the information provided in this application form is true, complete and 
            correct to the best of my knowledge and belief. I understand that any false information or 
            suppression of facts may lead to cancellation of my admission at any stage.
          </p>
          <p style="font-size: 9pt; line-height: 1.4; text-align: justify; margin: 8px 0;">
            I have carefully read and understood the eligibility criteria, rules and regulations, terms and 
            conditions of admission to the Distance Education Programme of Periyar University and agree to 
            abide by them. I also undertake to abide by the rules and regulations of the University as 
            amended from time to time.
          </p>
          <p style="font-size: 9pt; line-height: 1.4; text-align: justify; margin: 8px 0;">
            I understand that admission to the programme is provisional and subject to verification of 
            original documents and eligibility criteria by the University. I agree to submit all required 
            documents and certificates in original for verification when called upon by the University.
          </p>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
          ${data.signature_url ? 
            `<div class="signature-image-container">
              <img src="http://127.0.0.1:8000${data.signature_url}" 
                   alt="Applicant Signature" 
                   style="max-width: 150px; max-height: 60px; object-fit: contain;" 
                   onerror="this.style.display='none';" />
            </div>` : 
            '<div class="signature-line"></div>'
          }
          <div class="signature-label">Signature of the Applicant</div>
        </div>


        <!-- Footer -->
        <div class="footer">
          <p style="margin: 5px 0; font-size: 9pt;">
            <strong>Centre for Distance and Online Education (CDOE)</strong>
          </p>
          <p style="margin: 5px 0; font-size: 9pt;">
            Periyar University, Salem - 636011, Tamil Nadu, India
          </p>
          <p style="margin: 5px 0; font-size: 9pt;">
            Phone: 0427-2345766, 2345520 | Email: 
            <a href="mailto:info@periyaruniversity.ac.in" class="footer-link">info@periyaruniversity.ac.in</a>
          </p>
          <p style="margin: 10px 0 5px 0; font-size: 9pt;">
            © ${new Date().getFullYear()} Periyar University. All Rights Reserved.
          </p>
          <p style="margin: 5px 0; font-size: 8pt; color: #666;">
            Generated on: ${new Date().toLocaleString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true 
            })}
          </p>
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

        // Auto-trigger print dialog if mode is download
        ${mode === 'download' ? `
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
        ` : ''}
      </script>
    </body>
    </html>
  `;
  
  // Open the PDF in a new window/tab with proper title
  const pdfWindow = window.open('', '_blank', 'width=900,height=1200');
  
  if (pdfWindow) {
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
  } else {
    alert('Please allow pop-ups to download the application form');
  }
};
