/**
 * PDF Generation Utilities
 * Generates PDF receipts and application forms
 */

export const generateReceiptPDF = (receiptData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${receiptData.application_id}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #6b7280;
        }
        .receipt-info {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .receipt-info h2 {
          color: #059669;
          margin-top: 0;
          font-size: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #d1d5db;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: 600;
          color: #4b5563;
          width: 40%;
        }
        .value {
          color: #111827;
          width: 60%;
          text-align: right;
          font-family: monospace;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h3 {
          color: #1e40af;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          font-size: 18px;
        }
        .amount-box {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .amount-box h2 {
          margin: 0;
          font-size: 36px;
        }
        .amount-box p {
          margin: 5px 0 0 0;
          opacity: 0.9;
        }
        .status-badge {
          display: inline-block;
          background: #d1fae5;
          color: #065f46;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        .security-note {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          font-size: 13px;
        }
        @media print {
          body { margin: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 ${receiptData.university || 'Periyar University'}</h1>
        <p>${receiptData.university_address || 'Salem, Tamil Nadu, India'}</p>
        <p style="font-weight: 600; color: #2563eb; margin-top: 10px;">PAYMENT RECEIPT</p>
      </div>

      <div class="receipt-info">
        <h2>✓ Payment Successful</h2>
        <div class="info-row">
          <span class="label">Receipt Date:</span>
          <span class="value">${receiptData.receipt_date || new Date().toLocaleString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Application ID:</span>
          <span class="value">${receiptData.application_id}</span>
        </div>
      </div>

      <div class="section">
        <h3>Student Information</h3>
        <div class="info-row">
          <span class="label">Name:</span>
          <span class="value">${receiptData.student_name}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">${receiptData.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">${receiptData.phone || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Course:</span>
          <span class="value">${receiptData.course}</span>
        </div>
        <div class="info-row">
          <span class="label">Mode of Study:</span>
          <span class="value">${receiptData.mode_of_study}</span>
        </div>
        <div class="info-row">
          <span class="label">LSC Center:</span>
          <span class="value">${receiptData.lsc_code} - ${receiptData.lsc_name}</span>
        </div>
      </div>

      <div class="amount-box">
        <p style="font-size: 16px; margin: 0;">Amount Paid</p>
        <h2>₹${receiptData.amount}</h2>
        <p>Application Fee (Including GST)</p>
      </div>

      <div class="section">
        <h3>Transaction Details</h3>
        <div class="info-row">
          <span class="label">Transaction ID:</span>
          <span class="value">${receiptData.transaction_id}</span>
        </div>
        <div class="info-row">
          <span class="label">Bank Transaction ID:</span>
          <span class="value">${receiptData.bank_transaction_id}</span>
        </div>
        <div class="info-row">
          <span class="label">Order ID:</span>
          <span class="value">${receiptData.order_id}</span>
        </div>
        <div class="info-row">
          <span class="label">Transaction Date:</span>
          <span class="value">${receiptData.transaction_date}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Mode:</span>
          <span class="value">${receiptData.payment_mode}</span>
        </div>
        <div class="info-row">
          <span class="label">Gateway:</span>
          <span class="value">${receiptData.gateway_name}</span>
        </div>
        <div class="info-row">
          <span class="label">Bank Name:</span>
          <span class="value">${receiptData.bank_name}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span>
          <span class="value"><span class="status-badge">${receiptData.payment_status}</span></span>
        </div>
        <div class="info-row">
          <span class="label">Response Code:</span>
          <span class="value">${receiptData.response_code}</span>
        </div>
        <div class="info-row">
          <span class="label">Response Message:</span>
          <span class="value">${receiptData.response_message}</span>
        </div>
      </div>

      <div class="security-note">
        <strong>⚠️ Important:</strong> This is an official payment receipt. Please save this for your records. 
        For any queries, contact the admission office with your Application ID.
      </div>

      <div class="footer">
        <p><strong>This is a computer-generated receipt and does not require a signature.</strong></p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>© ${new Date().getFullYear()} ${receiptData.university || 'Periyar University'}. All rights reserved.</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateApplicationPDF = (applicationData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Application Form - ${applicationData.application_id}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3730a3;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #6b7280;
        }
        .app-id-box {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .app-id-box h2 {
          margin: 0;
          font-size: 24px;
          font-family: monospace;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          color: #3730a3;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          font-size: 18px;
        }
        .info-row {
          display: flex;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .label {
          font-weight: 600;
          color: #4b5563;
          width: 35%;
        }
        .value {
          color: #111827;
          width: 65%;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 12px;
        }
        .status-paid {
          background: #d1fae5;
          color: #065f46;
        }
        .status-pending {
          background: #fed7aa;
          color: #92400e;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        @media print {
          body { margin: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 Periyar University</h1>
        <p>Salem, Tamil Nadu, India</p>
        <p style="font-weight: 600; color: #4f46e5; margin-top: 10px;">APPLICATION FORM</p>
      </div>

      <div class="app-id-box">
        <p style="margin: 0 0 5px 0; font-size: 14px; opacity: 0.9;">Application ID</p>
        <h2>${applicationData.application_id}</h2>
      </div>

      <div class="section">
        <h3>Personal Information</h3>
        <div class="info-row">
          <span class="label">Student Name:</span>
          <span class="value">${applicationData.student_name}</span>
        </div>
        <div class="info-row">
          <span class="label">Name as per Records:</span>
          <span class="value">${applicationData.name_initial || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Email Address:</span>
          <span class="value">${applicationData.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone Number:</span>
          <span class="value">${applicationData.phone || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <h3>Course Details</h3>
        <div class="info-row">
          <span class="label">Programme Applied:</span>
          <span class="value">${applicationData.programme_applied || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Course:</span>
          <span class="value">${applicationData.course}</span>
        </div>
        <div class="info-row">
          <span class="label">Mode of Study:</span>
          <span class="value">${applicationData.mode_of_study}</span>
        </div>
        <div class="info-row">
          <span class="label">Academic Year:</span>
          <span class="value">${applicationData.academic_year}</span>
        </div>
      </div>

      <div class="section">
        <h3>Application Status</h3>
        <div class="info-row">
          <span class="label">Application Status:</span>
          <span class="value">${applicationData.status}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Status:</span>
          <span class="value">
            <span class="status-badge ${applicationData.payment_status === 'Paid' ? 'status-paid' : 'status-pending'}">
              ${applicationData.payment_status}
            </span>
          </span>
        </div>
      </div>

      <div class="footer">
        <p><strong>This is a computer-generated application form.</strong></p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>For any queries, please contact the admission office.</p>
        <p>© ${new Date().getFullYear()} Periyar University. All rights reserved.</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};
