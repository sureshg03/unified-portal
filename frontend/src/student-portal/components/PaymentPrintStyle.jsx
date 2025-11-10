import React from 'react';

/**
 * Professional Print Style for Payment Receipt
 * Provides clean, formal table-based layout for payment receipt printing
 */
const PaymentPrintStyle = () => {
  return (
    <style>
      {`
        @page {
          size: A4;
          margin: 20mm;
        }

        @media print {
          /* Reset and base styles */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
            line-height: 1.6;
          }

          /* Hide non-print elements */
          .no-print,
          button,
          .back-button,
          .payment-button,
          .animate-glow,
          .holographic,
          .secure-badge,
          .payment-icons {
            display: none !important;
          }

          /* Main container */
          .print-receipt {
            border: 3px double #000000;
            padding: 30px;
            background: #FFFFFF;
            box-shadow: none;
            margin: 0;
          }

          /* Header section */
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .receipt-header h1 {
            font-size: 24pt;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .receipt-header p {
            font-size: 12pt;
            margin: 5px 0;
            color: #000000;
          }

          /* Receipt title */
          .receipt-title {
            text-align: center;
            font-size: 20pt;
            font-weight: bold;
            margin: 20px 0;
            padding: 15px;
            background: #f5f5f5;
            border: 2px solid #000000;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }

          /* Payment details table */
          .payment-details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            border: 2px solid #000000;
          }

          .payment-details-table th,
          .payment-details-table td {
            border: 1px solid #000000;
            padding: 12px 15px;
            text-align: left;
            font-size: 12pt;
          }

          .payment-details-table th {
            background: #e8e8e8;
            font-weight: bold;
            width: 40%;
          }

          .payment-details-table td {
            background: #FFFFFF;
            width: 60%;
          }

          /* Amount highlight */
          .amount-highlight {
            font-size: 16pt;
            font-weight: bold;
            color: #000000;
            background: #f0f0f0;
            padding: 15px;
            text-align: center;
            border: 2px solid #000000;
            margin: 20px 0;
          }

          /* Transaction info box */
          .transaction-box {
            border: 2px solid #000000;
            padding: 20px;
            margin: 30px 0;
            background: #fafafa;
          }

          .transaction-box h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #000000;
          }

          /* Status badge */
          .status-success {
            display: inline-block;
            padding: 10px 20px;
            background: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 5px;
            font-weight: bold;
            font-size: 14pt;
            color: #2e7d32;
            text-transform: uppercase;
          }

          .status-pending {
            display: inline-block;
            padding: 10px 20px;
            background: #fff3e0;
            border: 2px solid #ff9800;
            border-radius: 5px;
            font-weight: bold;
            font-size: 14pt;
            color: #e65100;
            text-transform: uppercase;
          }

          .status-failed {
            display: inline-block;
            padding: 10px 20px;
            background: #ffebee;
            border: 2px solid #f44336;
            border-radius: 5px;
            font-weight: bold;
            font-size: 14pt;
            color: #c62828;
            text-transform: uppercase;
          }

          /* Footer section */
          .receipt-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #000000;
            text-align: center;
          }

          .receipt-footer p {
            font-size: 11pt;
            margin: 8px 0;
            color: #000000;
          }

          /* Logo styling */
          .print-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin: 0 auto 15px;
            display: block;
            border: 2px solid #000000;
            padding: 5px;
            background: #FFFFFF;
          }

          /* Watermark */
          .receipt-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72pt;
            color: rgba(0, 0, 0, 0.05);
            z-index: -1;
            font-weight: bold;
            pointer-events: none;
          }

          /* Terms and conditions */
          .terms-section {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #000000;
            background: #f9f9f9;
          }

          .terms-section h4 {
            font-size: 12pt;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #000000;
          }

          .terms-section ul {
            margin: 0;
            padding-left: 25px;
            font-size: 10pt;
            line-height: 1.6;
          }

          .terms-section li {
            margin: 5px 0;
          }

          /* Print timestamp */
          .print-timestamp {
            text-align: right;
            font-size: 10pt;
            color: #666666;
            margin-top: 20px;
            font-style: italic;
          }

          /* QR Code area (placeholder) */
          .qr-code-box {
            width: 100px;
            height: 100px;
            border: 2px solid #000000;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10pt;
            background: #FFFFFF;
          }

          /* Signature line */
          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }

          .signature-box {
            width: 45%;
            text-align: center;
          }

          .signature-line {
            border-top: 2px solid #000000;
            margin-top: 50px;
            padding-top: 10px;
            font-size: 11pt;
            font-weight: bold;
          }

          /* Important notice box */
          .notice-box {
            margin: 20px 0;
            padding: 15px;
            border: 2px solid #000000;
            background: #fffde7;
          }

          .notice-box strong {
            display: block;
            font-size: 12pt;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          .notice-box p {
            margin: 5px 0;
            font-size: 11pt;
            line-height: 1.5;
          }

          /* Remove all animations and transitions */
          * {
            animation: none !important;
            transition: none !important;
          }

          /* Hide gradients and modern effects */
          .bg-gradient-to-r,
          .bg-gradient-to-br,
          .animate-pulse,
          .animate-spin {
            background: #FFFFFF !important;
            animation: none !important;
          }

          /* Clean borders throughout */
          .payment-card {
            border: 2px solid #000000 !important;
            background: #FFFFFF !important;
            box-shadow: none !important;
          }

          /* Page break control */
          .page-break-avoid {
            page-break-inside: avoid;
          }

          h1, h2, h3, h4 {
            page-break-after: avoid;
          }

          /* Remove hover effects */
          *:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `}
    </style>
  );
};

export default PaymentPrintStyle;
