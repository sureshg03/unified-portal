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

    // Get photo URL if available
    const photoUrl = applicationData.photo_url || '';

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
      margin: 15mm;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 10mm;
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
      margin-bottom: 5px;
    }

    .header-left {
      text-align: left;
      font-size: 9pt;
      color: #666;
    }

    .header-right {
      text-align: right;
      font-size: 9pt;
      color: #666;
      font-weight: bold;
    }

    .logo-section {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 8px;
      position: relative;
    }

    .university-logo {
      width: 80px;
      height: 80px;
      margin-right: 15px;
    }

    .university-details {
      text-align: center;
    }

    .university-name {
      font-size: 22pt;
      font-weight: bold;
      color: #8B0000;
      margin-bottom: 3px;
    }

    .university-subtitle {
      font-size: 10pt;
      color: #333;
      margin-bottom: 2px;
    }

    .university-address {
      font-size: 10pt;
      color: #555;
    }

    .cdoe-title {
      background: linear-gradient(to right, #FF8C00, #FFA500);
      color: white;
      padding: 8px;
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 10px 0 5px 0;
    }

    .odl-subtitle {
      color: #FF8C00;
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .main-title {
      font-size: 12pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 10px 0;
      color: #000;
    }

    /* Application Info Box */
    .info-box {
      border: 2px solid #333;
      padding: 10px;
      margin-bottom: 15px;
      position: relative;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 10pt;
    }

    .info-label {
      font-weight: bold;
      color: #000;
    }

    .info-value {
      color: #00008B;
      font-weight: bold;
    }

    .photo-box {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 100px;
      height: 120px;
      border: 2px solid #333;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-box img {
      max-width: 96px;
      max-height: 116px;
      object-fit: cover;
    }

    /* Main Content Table */
    .content-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10pt;
    }

    .content-table td {
      border: 1px solid #333;
      padding: 6px 8px;
      vertical-align: top;
    }

    .row-number {
      width: 30px;
      text-align: center;
      font-weight: bold;
      background: #f0f0f0;
    }

    .field-label {
      width: 200px;
      font-weight: normal;
      color: #000;
    }

    .field-separator {
      width: 20px;
      text-align: center;
      font-weight: bold;
    }

    .field-value {
      color: #00008B;
      font-weight: bold;
    }

    .view-link {
      color: #0066cc;
      text-decoration: underline;
      cursor: pointer;
      margin-left: 5px;
    }

    /* Section Headers */
    .section-header {
      background: #f8f8f8;
      border: 1px solid #333;
      padding: 8px;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 10px;
      font-size: 11pt;
    }

    .section-title {
      display: flex;
      justify-content: space-between;
    }

    /* Education Table */
    .education-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9pt;
    }

    .education-table th,
    .education-table td {
      border: 1px solid #333;
      padding: 5px;
      text-align: center;
    }

    .education-table th {
      background: #e8e8e8;
      font-weight: bold;
      font-size: 9pt;
    }

    .education-table td {
      color: #00008B;
      font-weight: 600;
    }

    /* Payment Status Section */
    .payment-section {
      border: 2px solid #333;
      padding: 10px;
      margin: 15px 0;
    }

    .payment-title {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
      text-decoration: underline;
    }

    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }

    .payment-table td {
      border: 1px solid #333;
      padding: 8px;
      font-size: 10pt;
    }

    .payment-label {
      font-weight: bold;
      width: 150px;
      background: #f5f5f5;
    }

    .payment-value {
      color: #00008B;
      font-weight: bold;
    }

    .payment-status-success {
      color: #008000;
      font-weight: bold;
    }

    /* Signature Section */
    .signature-section {
      margin-top: 30px;
      text-align: right;
      padding-right: 50px;
    }

    .signature-line {
      border-top: 2px solid #000;
      width: 200px;
      margin: 50px 0 10px auto;
    }

    .signature-label {
      font-weight: bold;
      font-size: 10pt;
    }

    /* Footer */
    .footer {
      margin-top: 30px;
      padding: 15px;
      background: #f0f0f0;
      text-align: center;
      font-size: 9pt;
      border-top: 2px solid #8B0000;
    }

    .footer-link {
      color: #0066cc;
      text-decoration: none;
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
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIzOCIgZmlsbD0iIzhCMDAwMCIgc3Ryb2tlPSIjRkZENzAwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZENzAwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI0MCIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBVPC90ZXh0Pgo8L3N2Zz4=" 
             alt="University Logo" class="university-logo">
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
    <div class="info-box">
      <div class="info-row">
        <div><span class="info-label">Application No :</span> <span class="info-value">${applicationData.application_id || 'N/A'}</span></div>
      </div>
      <div class="info-row">
        <div><span class="info-label">Enrollment No :</span> <span class="info-value">${applicationData.enrollment_no || 'N/A'}</span></div>
      </div>
      <div class="info-row">
        <div><span class="info-label">Applied Date :</span> <span class="info-value">${applicationData.applied_date || new Date().toLocaleDateString('en-GB')}</span></div>
      </div>
      <div class="info-row">
        <div><span class="info-label">LSC :</span> <span class="info-value">${applicationData.lsc_name || 'CDOE - Centre for Distance and Online Education (LC2101)'}</span></div>
      </div>

      ${photoUrl ? `
      <div class="photo-box">
        <img src="${photoUrl}" alt="Applicant Photo">
      </div>
      ` : `
      <div class="photo-box">
        <div style="color: #999; font-size: 10pt; text-align: center;">No Photo</div>
      </div>
      `}
    </div>

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
          applicationData.qualifications.map(qual => `
            <tr>
              <td>${qual.course || 'N/A'}</td>
              <td>${qual.institution || 'N/A'}</td>
              <td>${qual.board || 'N/A'}</td>
              <td>${qual.subjects || 'N/A'}</td>
              <td>${qual.register_no || 'N/A'}</td>
              <td>${qual.percentage || 'N/A'}</td>
              <td>${qual.month_of_passing || 'N/A'}</td>
              <td>${qual.year_of_passing || 'N/A'}</td>
              <td>${qual.mode_of_study || 'Regular'}</td>
              <td>${qual.document ? '<span class="view-link">View</span>' : ''}</td>
            </tr>
          `).join('') 
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
      <div class="signature-line"></div>
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
