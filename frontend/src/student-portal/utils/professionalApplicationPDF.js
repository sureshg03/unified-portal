/**
 * Professional Application PDF Generator
 * Matches the exact format and layout of PUCDOE reference PDF
 * Includes all sections with proper formatting, borders, and styling
 */

export const generateProfessionalApplicationPDF = (data) => {
  // Helper function to convert image URL to base64
  const getImageAsBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  };

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
        /* Reset and Base Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 15mm;
          /* Remove default headers and footers in print */
          @top-left { content: none; }
          @top-center { content: none; }
          @top-right { content: none; }
          @bottom-left { content: none; }
          @bottom-center { content: none; }
          @bottom-right { content: none; }
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
          background: #fff;
          padding: 20px;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          border: 3px solid #000;
          padding: 20px;
        }
        
        /* Header Section */
        .header {
          text-align: center;
          border-bottom: 3px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        
        .university-name {
          font-size: 24pt;
          font-weight: bold;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 10px 0;
        }
        
        .directorate-name {
          font-size: 18pt;
          font-weight: bold;
          color: #1a1a1a;
          margin: 5px 0;
        }
        
        .application-title {
          font-size: 16pt;
          font-weight: bold;
          color: #000;
          text-decoration: underline;
          margin: 10px 0;
        }
        
        .accreditation-info {
          font-size: 10pt;
          color: #333;
          margin-top: 8px;
          line-height: 1.4;
          font-style: italic;
        }
        
        /* Application Info Boxes */
        .app-info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
          page-break-inside: avoid;
        }
        
        .info-box {
          border: 2px solid #000;
          padding: 12px;
          text-align: center;
          background: #f9f9f9;
        }
        
        .info-box-label {
          font-size: 10pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #333;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .info-box-value {
          font-size: 14pt;
          font-weight: bold;
          color: #000;
        }
        
        /* Section Styles */
        .section {
          margin: 20px 0;
          page-break-inside: avoid;
        }
        
        .section-heading {
          background: #000;
          color: #fff;
          padding: 10px 15px;
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }
        
        /* Data Table */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          border: 1px solid #000;
        }
        
        .data-table tr {
          border-bottom: 1px solid #333;
        }
        
        .data-table td {
          padding: 8px 12px;
          vertical-align: top;
        }
        
        .data-table .label {
          width: 40%;
          font-weight: bold;
          color: #000;
          background: #f5f5f5;
          border-right: 2px solid #000;
          font-size: 11pt;
        }
        
        .data-table .value {
          width: 60%;
          color: #000;
          padding-left: 15px;
          font-size: 11pt;
        }
        
        /* Qualification Table */
        .qual-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 9pt;
        }
        
        .qual-table th,
        .qual-table td {
          border: 1px solid #000;
          padding: 6px 4px;
          text-align: left;
          vertical-align: middle;
        }
        
        .qual-table th {
          background: #000;
          color: #fff;
          font-weight: bold;
          text-align: center;
          font-size: 9pt;
          text-transform: uppercase;
          padding: 8px 4px;
        }
        
        .qual-table td {
          background: #fff;
        }
        
        .qual-table tr:nth-child(even) td {
          background: #f9f9f9;
        }
        
        /* Declaration Box */
        .declaration-box {
          margin: 25px 0;
          padding: 20px;
          border: 2px solid #000;
          background: #fafafa;
          page-break-inside: avoid;
        }
        
        .declaration-box h3 {
          font-size: 12pt;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        
        .declaration-box p {
          text-align: justify;
          line-height: 1.6;
          margin-bottom: 10px;
          font-size: 11pt;
        }
        
        /* Signature Section */
        .signature-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 40px;
          page-break-inside: avoid;
        }
        
        .signature-block {
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #000;
          margin-top: 60px;
          padding-top: 8px;
          font-weight: bold;
          font-size: 11pt;
        }
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 3px solid #000;
          text-align: center;
          font-size: 10pt;
          color: #333;
          page-break-inside: avoid;
        }
        
        .footer p {
          margin: 5px 0;
        }
        
        .footer .office-use {
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
          font-size: 11pt;
        }
        
        /* Address Block */
        .address-block {
          padding: 12px;
          background: #fff;
          border-left: 3px solid #000;
          margin: 10px 0;
        }
        
        /* Payment Status Badge */
        .payment-badge {
          display: inline-block;
          padding: 8px 20px;
          background: #4CAF50;
          color: white;
          font-weight: bold;
          border-radius: 5px;
          font-size: 12pt;
        }
        
        .payment-badge.unpaid {
          background: #f44336;
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
          
          .container {
            border: 2px solid #000;
            padding: 15px;
            box-shadow: none;
          }
          
          .section {
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none;
          }

          .action-buttons {
            display: none !important;
          }
        }
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-bold { font-weight: bold; }
        .text-uppercase { text-transform: uppercase; }
        .mt-10 { margin-top: 10px; }
        .mt-20 { margin-top: 20px; }
        .mb-10 { margin-bottom: 10px; }
        .p-10 { padding: 10px; }
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
          <div class="logo-section">
            <img src="/Logo.png" alt="University Logo" style="height: 60px; margin-right: 15px;" onerror="console.error('Logo failed to load'); this.onerror=null; this.style.visibility='hidden';" />
            <div style="text-align: center;">
              <div class="university-name">PERIYAR UNIVERSITY</div>
              <div style="font-size: 10pt; color: #c00; font-weight: bold; margin-top: 3px;">State University - NAAC 'A+' Grade - NIRF Rank 94</div>
              <div style="font-size: 9pt; color: #333; margin-top: 2px;">State Public University Rank 40 - SDG Institutions Rank Band: 11-50</div>
              <div style="font-size: 9pt; color: #333; margin-bottom: 5px;">Salem-636011, Tamilnadu, India.</div>
            </div>
          </div>
          <div style="font-size: 16pt; font-weight: bold; color: #ff6600; margin: 8px 0;">CENTRE FOR DISTANCE AND ONLINE EDUCATION (CDOE)</div>
          <div style="font-size: 12pt; font-weight: bold; color: #ff6600;">Open and Distance Learning</div>
          <div class="application-title" style="margin-top: 10px; text-decoration: underline;">Open and Distance Learning Programme (ODL) Admission for the Academic Year ${data.academic_year || '2025-26'}</div>
        </div>
        
        <!-- Application Info Section -->
        <div style="margin: 20px 0; padding: 15px; border: 2px solid #000;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #333; background: #f5f5f5; font-weight: bold; width: 30%;">Application No :</td>
              <td style="padding: 8px; border: 1px solid #333; font-weight: bold; color: #c00;">${data.application_id || 'To Be Generated'}</td>
              <td style="padding: 8px; border: 1px solid #333; background: #f9f9f9; width: 150px; text-align: center; vertical-align: middle;" rowspan="3">
                ${data.photo_url ? 
                  `<img src="http://127.0.0.1:8000${data.photo_url}" alt="Applicant Photo" style="width: 120px; height: 150px; object-fit: cover; border: 2px solid #333;" onerror="this.onerror=null; this.src=''; this.alt='Photo Not Available'; this.style='width:120px; height:150px; border:2px solid #333; display:flex; align-items:center; justify-content:center; background:#f0f0f0; color:#666; font-size:10px;';" />` : 
                  '<div style="width: 120px; height: 150px; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666; font-size: 11px; font-weight: bold;">PHOTO<br/>NOT<br/>UPLOADED</div>'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333; background: #f5f5f5; font-weight: bold;">Enrollment No :</td>
              <td style="padding: 8px; border: 1px solid #333; font-weight: bold;">${data.enrollment_no || 'To Be Assigned'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333; background: #f5f5f5; font-weight: bold;">Applied Date :</td>
              <td style="padding: 8px; border: 1px solid #333;">${data.applied_date || new Date().toLocaleDateString('en-GB')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333; background: #f5f5f5; font-weight: bold;">LSC :</td>
              <td style="padding: 8px; border: 1px solid #333;" colspan="2">${data.lsc_name || 'Not Assigned'} (${data.lsc_code || 'N/A'})</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 1: Programme Applied For -->
        <div class="section">
          <div class="section-heading">1. Programme Applied For</div>
          <table class="data-table">
            <tr>
              <td class="label">Programme</td>
              <td class="value">${data.programme_applied || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Course</td>
              <td class="value">${data.course || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Medium of Instruction</td>
              <td class="value">${data.medium || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Mode of Study</td>
              <td class="value">${data.mode_of_study || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Academic Year</td>
              <td class="value">${data.academic_year || 'Not Specified'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 2: Learning Support Centre -->
        <div class="section">
          <div class="section-heading">2. Learning Support Centre (LSC)</div>
          <table class="data-table">
            <tr>
              <td class="label">LSC Code</td>
              <td class="value">${data.lsc_code || 'Not Assigned'}</td>
            </tr>
            <tr>
              <td class="label">LSC Name & Address</td>
              <td class="value">${data.lsc_name || 'Not Assigned'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 3: Personal Details -->
        <div class="section">
          <div class="section-heading">3. Personal Details of the Applicant</div>
          <table class="data-table">
            <tr>
              <td class="label">Name (with Initial)</td>
              <td class="value">${data.name_initial || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Full Name</td>
              <td class="value">${data.student_name || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Date of Birth</td>
              <td class="value">${data.dob || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Gender</td>
              <td class="value">${data.gender || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Mother Tongue</td>
              <td class="value">${data.mother_tongue || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Nationality</td>
              <td class="value">${data.nationality || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Religion</td>
              <td class="value">${data.religion || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Community / Category</td>
              <td class="value">${data.community || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Blood Group</td>
              <td class="value">${data.blood_group || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">Differently Abled</td>
              <td class="value">${data.differently_abled || 'No'}${data.disability_type ? ' (' + data.disability_type + ')' : ''}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 4: Parent / Guardian Details -->
        <div class="section">
          <div class="section-heading">4. Parent / Guardian Details</div>
          <table class="data-table">
            <tr>
              <td class="label">Father's Name</td>
              <td class="value">${data.father_name || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Father's Occupation</td>
              <td class="value">${data.father_occupation || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Mother's Name</td>
              <td class="value">${data.mother_name || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Mother's Occupation</td>
              <td class="value">${data.mother_occupation || 'Not Provided'}</td>
            </tr>
            ${data.guardian_name ? `
            <tr>
              <td class="label">Guardian's Name</td>
              <td class="value">${data.guardian_name}</td>
            </tr>
            <tr>
              <td class="label">Guardian's Occupation</td>
              <td class="value">${data.guardian_occupation || 'Not Provided'}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <!-- Section 5: Contact Details -->
        <div class="section">
          <div class="section-heading">5. Contact Details</div>
          <table class="data-table">
            <tr>
              <td class="label">Mobile Number</td>
              <td class="value">${data.phone || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Email Address</td>
              <td class="value">${data.email || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Internet Access</td>
              <td class="value">${data.access_internet || 'Not Specified'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 6: Communication Address -->
        <div class="section">
          <div class="section-heading">6. Communication Address</div>
          <div class="address-block">
            ${formatAddress(data, 'comm')}
          </div>
        </div>
        
        <!-- Section 7: Permanent Address -->
        <div class="section">
          <div class="section-heading">7. Permanent Address</div>
          <div class="address-block">
            ${formatAddress(data, 'perm')}
          </div>
        </div>
        
        <!-- Section 8: Identification Details -->
        <div class="section">
          <div class="section-heading">8. Identification Details</div>
          <table class="data-table">
            <tr>
              <td class="label">Aadhaar Number</td>
              <td class="value">${data.aadhaar_no || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">Name as per Aadhaar</td>
              <td class="value">${data.name_as_aadhaar || 'Not Provided'}</td>
            </tr>
            <tr>
              <td class="label">ABC ID (Academic Bank of Credits)</td>
              <td class="value">${data.abc_id || 'Not Applicable'}</td>
            </tr>
            <tr>
              <td class="label">DEB ID (Digital Education Board)</td>
              <td class="value">${data.deb_id || 'Not Applicable'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 18: Educational Qualifications -->
        <div class="section">
          <div class="section-heading">9. Educational Qualifications</div>
          <table class="qual-table">
            <thead>
              <tr>
                <th style="width: 8%;">Course</th>
                <th style="width: 15%;">Institution</th>
                <th style="width: 12%;">Board/University</th>
                <th style="width: 18%;">Subjects Studied</th>
                <th style="width: 10%;">Register No</th>
                <th style="width: 6%;">%</th>
                <th style="width: 8%;">Month</th>
                <th style="width: 6%;">Year</th>
                <th style="width: 10%;">Mode</th>
                <th style="width: 7%;">Doc</th>
              </tr>
            </thead>
            <tbody>
              ${formatQualificationsTable(data.qualifications)}
            </tbody>
          </table>
        </div>
        
        <!-- Section 10: Work Experience (if applicable) -->
        ${data.current_designation || data.current_institute || data.years_experience ? `
        <div class="section">
          <div class="section-heading">10. Work Experience (If Applicable)</div>
          <table class="data-table">
            <tr>
              <td class="label">Current Designation</td>
              <td class="value">${data.current_designation || 'Not Applicable'}</td>
            </tr>
            <tr>
              <td class="label">Institution / Organization</td>
              <td class="value">${data.current_institute || 'Not Applicable'}</td>
            </tr>
            <tr>
              <td class="label">Years of Experience</td>
              <td class="value">${data.years_experience || 'Not Applicable'}</td>
            </tr>
            <tr>
              <td class="label">Annual Income</td>
              <td class="value">${data.annual_income ? '₹ ' + data.annual_income : 'Not Provided'}</td>
            </tr>
          </table>
        </div>
        ` : ''}
        
        <!-- Section 11: Payment Status -->
        <div class="section">
          <div class="section-heading">11. Application Fee Payment Status</div>
          <table class="data-table">
            <tr>
              <td class="label">Payment Status</td>
              <td class="value">
                <span class="payment-badge ${data.payment_status === 'Paid' ? '' : 'unpaid'}">
                  ${data.payment_status || 'Not Paid'}
                </span>
              </td>
            </tr>
            ${data.transaction_id ? `
            <tr>
              <td class="label">Transaction ID</td>
              <td class="value"><strong>${data.transaction_id}</strong></td>
            </tr>
            <tr>
              <td class="label">Order ID</td>
              <td class="value">${data.order_id || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Amount Paid</td>
              <td class="value"><strong>₹ ${data.amount || '236.00'}</strong></td>
            </tr>
            <tr>
              <td class="label">Payment Mode</td>
              <td class="value">${data.payment_mode || 'Online Payment'}</td>
            </tr>
            <tr>
              <td class="label">Transaction Date & Time</td>
              <td class="value">${data.transaction_date || 'N/A'}</td>
            </tr>
            ` : `
            <tr>
              <td class="label">Amount Payable</td>
              <td class="value"><strong>₹ 236.00</strong></td>
            </tr>
            `}
          </table>
        </div>
        
        <!-- Declaration -->
        <div class="declaration-box">
          <h3>Declaration</h3>
          <p>
            I hereby declare that the information provided in this application form is true, complete and 
            correct to the best of my knowledge and belief. I understand that any false information or 
            suppression of facts may lead to cancellation of my admission at any stage. I have carefully 
            read and understood the eligibility criteria, rules and regulations, terms and conditions of 
            admission to the Distance Education Programme of Pondicherry University and agree to abide by 
            them. I also undertake to abide by the rules and regulations of the University as amended from 
            time to time.
          </p>
          <p>
            I understand that admission to the programme is provisional and subject to verification of 
            original documents and eligibility criteria by the University. I agree to submit all required 
            documents and certificates in original for verification when called upon by the University.
          </p>
          
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line">Date: ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
            <div class="signature-block">
              <div class="signature-line">Place: ${data.perm_district || data.comm_district || 'Not Specified'}</div>
            </div>
            <div class="signature-block">
              ${data.signature_url ? 
                `<div style="margin-bottom: 10px; min-height: 50px; display: flex; align-items: center; justify-content: center;">
                  <img src="http://127.0.0.1:8000${data.signature_url}" alt="Applicant Signature" style="max-width: 150px; max-height: 50px; object-fit: contain;" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'color:#999; font-size:9px;\\'>Signature Not Available</span>';" />
                </div>` : 
                '<div style="margin-bottom: 10px; min-height: 50px; display: flex; align-items: center; justify-content: center; border: 1px dashed #ccc; background: #f9f9f9;"><span style="color: #999; font-size: 9px;">Signature Not Uploaded</span></div>'}
              <div class="signature-line">Signature of the Applicant</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p style="text-align: center; font-size: 9pt; color: #666; padding: 10px; border-top: 2px solid #ccc; margin-top: 20px;">
            <strong style="color: #000;">© Periyar University, Salem.</strong> All Right Reserved.
          </p>
          <p style="text-align: center; font-size: 9pt; color: #666; margin-top: 5px;">
            <strong>Generated On:</strong> ${new Date().toLocaleString('en-IN', { 
              day: '2-digit', 
              month: '2-digit', 
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
