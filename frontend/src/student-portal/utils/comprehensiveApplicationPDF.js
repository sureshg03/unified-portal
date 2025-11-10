/**
 * Comprehensive Application PDF Generator
 * Includes ALL details from Page 1, 2, 3 and Payment
 */

export const generateComprehensiveApplicationPDF = (data) => {
  // Helper function to format qualifications table
  const formatQualificationsTable = (qualifications) => {
    if (!qualifications || qualifications.length === 0) {
      return '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No qualification data available</td></tr>';
    }
    
    return qualifications.map(qual => `
      <tr>
        <td>${qual.exam_passed || 'N/A'}</td>
        <td>${qual.board_university || 'N/A'}</td>
        <td>${qual.month_year || 'N/A'}</td>
        <td>${qual.register_no || 'N/A'}</td>
        <td>${qual.percentage || 'N/A'}</td>
        <td>${qual.class_grade || 'N/A'}</td>
        <td>${qual.major_subject || 'N/A'}</td>
      </tr>
    `).join('');
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Application Form - ${data.application_id || 'N/A'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', 'Times New Roman', serif;
          padding: 30px;
          background: white;
          color: #000;
          font-size: 13px;
          line-height: 1.5;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border: 2px solid #000;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #000;
        }
        
        .header h1 {
          color: #000;
          font-size: 22px;
          margin-bottom: 5px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .header .subtitle {
          font-size: 16px;
          font-weight: bold;
          margin: 5px 0;
        }
        
        .header .accreditation {
          font-size: 11px;
          color: #333;
          margin-top: 8px;
          line-height: 1.4;
        }
        
        .app-info-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }
        
        .info-box {
          border: 2px solid #000;
          padding: 10px;
          text-align: center;
        }
        
        .info-box .label {
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .info-box .value {
          font-size: 14px;
          font-weight: bold;
          color: #000;
        }
        
        .section {
          margin: 15px 0;
          page-break-inside: avoid;
        }
        
        .section-title {
          background: #000;
          color: white;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        .info-table td {
          padding: 8px;
          border: 1px solid #000;
          vertical-align: top;
        }
        
        .info-table .label-cell {
          width: 35%;
          font-weight: bold;
          background: #f5f5f5;
        }
        
        .info-table .value-cell {
          width: 65%;
        }
        
        .qualification-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 12px;
        }
        
        .qualification-table th,
        .qualification-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        
        .qualification-table th {
          background: #e0e0e0;
          font-weight: bold;
          text-align: center;
        }
        
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        .payment-table th,
        .payment-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        
        .payment-table th {
          background: #e0e0e0;
          font-weight: bold;
        }
        
        .declaration {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #000;
          font-size: 12px;
          line-height: 1.6;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #000;
          text-align: center;
          font-size: 11px;
          color: #333;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .container {
            border: 1px solid #000;
            padding: 15px;
          }
          
          @page {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>Pondicherry University</h1>
          <div class="subtitle">Directorate of Distance Education</div>
          <div class="subtitle">Application Form for Admission</div>
          <div class="accreditation">
            (A Central University Established by an Act of Parliament)<br/>
            NAAC Accredited with 'A++' Grade | NIRF Rank 15 (University Category)
          </div>
        </div>
        
        <!-- Application Number & Enrollment -->
        <div class="app-info-boxes">
          <div class="info-box">
            <div class="label">APPLICATION NUMBER</div>
            <div class="value">${data.application_id || 'Not Generated'}</div>
          </div>
          <div class="info-box">
            <div class="label">DATE OF APPLICATION</div>
            <div class="value">${data.applied_date || new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        
        <!-- Section 1: Programme Applied -->
        <div class="section">
          <div class="section-title">1. Programme Applied For</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Programme</td>
              <td class="value-cell">${data.programme_applied || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Course</td>
              <td class="value-cell">${data.course || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Medium of Instruction</td>
              <td class="value-cell">${data.medium || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Mode of Study</td>
              <td class="value-cell">${data.mode_of_study || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Academic Year</td>
              <td class="value-cell">${data.academic_year || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 2: Learning Support Centre -->
        <div class="section">
          <div class="section-title">2. Learning Support Centre (LSC)</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">LSC Code</td>
              <td class="value-cell">${data.lsc_code || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">LSC Name</td>
              <td class="value-cell">${data.lsc_name || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 3: Personal Details -->
        <div class="section">
          <div class="section-title">3. Personal Details of the Applicant</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Name Initial</td>
              <td class="value-cell">${data.name_initial || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Full Name</td>
              <td class="value-cell">${data.student_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Date of Birth</td>
              <td class="value-cell">${data.dob || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Gender</td>
              <td class="value-cell">${data.gender || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 4: Parent/Guardian Details -->
        <div class="section">
          <div class="section-title">4. Parent / Guardian Details</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Father's Name</td>
              <td class="value-cell">${data.father_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Father's Occupation</td>
              <td class="value-cell">${data.father_occupation || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Mother's Name</td>
              <td class="value-cell">${data.mother_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Mother's Occupation</td>
              <td class="value-cell">${data.mother_occupation || 'N/A'}</td>
            </tr>
            ${data.guardian_name ? `
            <tr>
              <td class="label-cell">Guardian's Name</td>
              <td class="value-cell">${data.guardian_name}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <!-- Section 5: Other Personal Details -->
        <div class="section">
          <div class="section-title">5. Other Personal Details</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Mother Tongue</td>
              <td class="value-cell">${data.mother_tongue || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Nationality</td>
              <td class="value-cell">${data.nationality || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Religion</td>
              <td class="value-cell">${data.religion || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Community</td>
              <td class="value-cell">${data.community || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Differently Abled</td>
              <td class="value-cell">${data.differently_abled || 'No'}</td>
            </tr>
            ${data.disability_type ? `
            <tr>
              <td class="label-cell">Type of Disability</td>
              <td class="value-cell">${data.disability_type}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label-cell">Blood Group</td>
              <td class="value-cell">${data.blood_group || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Internet Access</td>
              <td class="value-cell">${data.access_internet || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 6: Contact Details -->
        <div class="section">
          <div class="section-title">6. Contact Details</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Mobile Number</td>
              <td class="value-cell">${data.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Email Address</td>
              <td class="value-cell">${data.email || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 7: Communication Address -->
        <div class="section">
          <div class="section-title">7. Communication Address</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Area / Street</td>
              <td class="value-cell">${data.comm_area || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Town / City</td>
              <td class="value-cell">${data.comm_town || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">District</td>
              <td class="value-cell">${data.comm_district || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">State</td>
              <td class="value-cell">${data.comm_state || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Country</td>
              <td class="value-cell">${data.comm_country || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Pincode</td>
              <td class="value-cell">${data.comm_pincode || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 8: Permanent Address -->
        <div class="section">
          <div class="section-title">8. Permanent Address</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Area / Street</td>
              <td class="value-cell">${data.perm_area || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Town / City</td>
              <td class="value-cell">${data.perm_town || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">District</td>
              <td class="value-cell">${data.perm_district || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">State</td>
              <td class="value-cell">${data.perm_state || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Country</td>
              <td class="value-cell">${data.perm_country || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Pincode</td>
              <td class="value-cell">${data.perm_pincode || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 9: Identification Details -->
        <div class="section">
          <div class="section-title">9. Identification Details</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Aadhaar Number</td>
              <td class="value-cell">${data.aadhaar_no || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Name as per Aadhaar</td>
              <td class="value-cell">${data.name_as_aadhaar || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">ABC ID (Academic Bank of Credits)</td>
              <td class="value-cell">${data.abc_id || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">DEB ID (Digital Education Board)</td>
              <td class="value-cell">${data.deb_id || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Section 10: Education Qualifications -->
        <div class="section">
          <div class="section-title">10. Educational Qualifications</div>
          <table class="qualification-table">
            <thead>
              <tr>
                <th>Exam Passed</th>
                <th>Board/University</th>
                <th>Month & Year</th>
                <th>Register No.</th>
                <th>Percentage</th>
                <th>Class/Grade</th>
                <th>Major Subject</th>
              </tr>
            </thead>
            <tbody>
              ${formatQualificationsTable(data.qualifications)}
            </tbody>
          </table>
        </div>
        
        <!-- Section 11: Work Experience -->
        ${data.current_designation ? `
        <div class="section">
          <div class="section-title">11. Work Experience (if applicable)</div>
          <table class="info-table">
            <tr>
              <td class="label-cell">Current Designation</td>
              <td class="value-cell">${data.current_designation}</td>
            </tr>
            <tr>
              <td class="label-cell">Institution/Organization</td>
              <td class="value-cell">${data.current_institute || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Years of Experience</td>
              <td class="value-cell">${data.years_experience || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label-cell">Annual Income</td>
              <td class="value-cell">${data.annual_income || 'N/A'}</td>
            </tr>
          </table>
        </div>
        ` : ''}
        
        <!-- Section 12: Payment Status -->
        <div class="section">
          <div class="section-title">12. Payment Status</div>
          <table class="payment-table">
            <tr>
              <th>Payment Status</th>
              <td><strong>${data.payment_status || 'Not Paid'}</strong></td>
            </tr>
            ${data.transaction_id ? `
            <tr>
              <th>Transaction ID</th>
              <td>${data.transaction_id}</td>
            </tr>
            <tr>
              <th>Order ID</th>
              <td>${data.order_id || 'N/A'}</td>
            </tr>
            <tr>
              <th>Amount Paid</th>
              <td>₹ ${data.amount || '236.00'}</td>
            </tr>
            <tr>
              <th>Payment Mode</th>
              <td>${data.payment_mode || 'Online'}</td>
            </tr>
            <tr>
              <th>Transaction Date & Time</th>
              <td>${data.transaction_date || 'N/A'}</td>
            </tr>
            <tr>
              <th>Payment Response</th>
              <td>${data.payment_response || 'N/A'}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <!-- Declaration -->
        <div class="declaration">
          <strong>DECLARATION:</strong><br/><br/>
          I hereby declare that the information provided above is true and correct to the best of my knowledge. 
          I understand that any false information may lead to cancellation of my admission. I have read and understood 
          the terms and conditions of admission to Pondicherry University Distance Education Programme and agree to abide 
          by the rules and regulations of the University.
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Date</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Place</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Signature of Applicant</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>For Office Use Only</strong></p>
          <p>Application Status: ${data.status || 'In Progress'} | Generated on ${new Date().toLocaleString('en-IN')}</p>
          <p>This is a computer-generated document. Please verify all details before submission.</p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
  
  const pdfWindow = window.open('', '_blank');
  pdfWindow.document.write(html);
  pdfWindow.document.close();
};
