import React from 'react';

/**
 * Professional Print Preview Component
 * Provides clean, formal table-based layout for application printing
 */
const PrintPreviewStyle = () => {
  return (
    <style>
      {`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }

        @media print {
          /* Reset and base styles */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            font-size: 10pt;
          }

          /* Hide non-print elements */
          .no-print,
          button {
            display: none !important;
          }

          /* Show icons in print for modern look */
          .section-icon {
            display: none !important;
          }

          /* Show print-only elements */
          .print-footer,
          .print-timestamp,
          .application-id-header {
            display: block !important;
          }

          /* Hide the on-screen declaration, show print version */
          .section-container.bg-gradient-to-br.from-indigo-50\/70.no-print {
            display: none !important;
          }

          /* Document border */
          .print-border {
            border: none;
            padding: 0;
            background: #FFFFFF;
            box-shadow: none;
            margin: 0;
            max-width: 100%;
            width: 100%;
          }

          /* Header section */
          .header-section {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 12px 15px;
            margin-bottom: 12px;
            border: 3px solid #1e40af;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            width: 100%;
            box-sizing: border-box;
            border-radius: 8px;
          }

          .header-text {
            flex: 1;
            text-align: center;
          }

          .header-text h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 6px 0;
            color: #1e40af;
            line-height: 1.3;
            letter-spacing: 0.5px;
          }

          .header-text h2 {
            font-size: 14pt;
            font-weight: bold;
            margin: 4px 0;
            color: #7c3aed;
            line-height: 1.2;
          }

          .header-text p {
            font-size: 10pt;
            margin: 3px 0;
            color: #374151;
            line-height: 1.3;
          }

          .header-text p:first-of-type {
            color: #6b7280;
            font-weight: 600;
          }

          /* Logo and photo styling */
          .print-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
            border: 3px solid #1e40af;
            padding: 3px;
            border-radius: 8px;
            background: #ffffff;
          }

          .print-photo {
            width: 90px;
            height: 115px;
            object-fit: cover;
            border: 3px solid #7c3aed;
            border-radius: 8px;
          }

          .print-signature {
            max-width: 120px;
            height: auto;
            border: 2px solid #000000;
            padding: 2px;
          }

          /* Titles */
          .main-title {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin: 6px 0;
            color: #1e40af;
            line-height: 1.3;
            letter-spacing: 0.5px;
          }

          .sub-title {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            margin: 6px 0;
            color: #7c3aed;
            line-height: 1.3;
          }

          .application-title {
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            padding: 8px 0;
            border-top: 3px solid #1e40af;
            border-bottom: 3px solid #1e40af;
            color: #1e40af;
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            border-radius: 6px;
          }

          /* Section containers - Modern table layout */
          .section-container {
            border: none;
            padding: 0;
            margin-bottom: 15px;
            background: transparent;
            page-break-inside: avoid;
            width: 100%;
            border-radius: 0;
            overflow: visible;
          }

          .section-container > * {
            page-break-inside: avoid;
          }

          /* Section titles - Clean header style */
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 8px 0;
            padding: 8px 12px;
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
            border-left: 5px solid #7c3aed;
            color: #ffffff;
            text-align: left;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-size: 10pt;
          }

          /* Convert all grids to modern tables */
          .section-container .grid {
            display: table !important;
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 0;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            overflow: hidden;
          }

          .section-container .grid > div {
            display: table-row !important;
          }

          /* Two column layout - label and value as cells */
          .section-container .grid-cols-2 > div {
            display: table-row !important;
            border-bottom: 1px solid #e5e7eb;
          }

          .section-container .grid-cols-2 > div:last-child {
            border-bottom: none;
          }

          .section-container .grid > div > div {
            display: table-cell !important;
            border-right: 1px solid #e5e7eb;
            padding: 12px 14px;
            vertical-align: middle;
          }

          .section-container .grid > div > div:last-child {
            border-right: none;
          }

          /* Make grid items act as table rows with proper label/value structure */
          .section-container .grid-cols-2 > div {
            display: table !important;
            width: 100%;
            border-collapse: collapse;
            margin: 0;
          }

          .section-container .grid-cols-2 > div > div {
            display: block !important;
          }

          /* Convert each grid item into a proper table row */
          .section-container .grid-cols-2 > div::before {
            content: '';
            display: table-row;
          }

          /* Style for field container within grid */
          .section-container .grid > div {
            border-bottom: 1px solid #666666;
            padding: 0;
          }

          .section-container .grid > div:last-child {
            border-bottom: none;
          }

          /* Single column grid */
          .section-container .grid.grid-cols-1 > div > div {
            width: 100%;
          }

          /* Field labels and values - Modern clean style */
          .field-label {
            font-weight: 600;
            font-size: 9.5pt;
            color: #1e40af;
            display: inline-block;
            min-width: 140px;
            background: transparent;
            padding: 0;
            margin: 0;
            border: none;
          }

          .field-label::after {
            content: ':';
            margin: 0 6px 0 2px;
          }

          .field-value {
            font-weight: normal;
            font-size: 9.5pt;
            color: #1f2937;
            display: inline;
            line-height: 1.6;
          }

          /* Grid cell backgrounds for better readability */
          .section-container .grid > div:nth-child(odd) > div:nth-child(odd),
          .section-container .grid > div:nth-child(even) > div:nth-child(even) {
            background: #f8fafc;
          }

          .section-container .grid > div:nth-child(odd) > div:nth-child(even),
          .section-container .grid > div:nth-child(even) > div:nth-child(odd) {
            background: #ffffff;
          }

          /* Alternative: Keep labels inline for compact view */
          .section-container .grid-cols-2 .field-label {
            display: inline !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            font-weight: bold;
            width: auto;
          }

          .section-container .grid-cols-2 .field-value {
            display: inline !important;
            width: auto;
          }

          .section-container .grid-cols-2 .field-label::after {
            content: ' ';
          }

          /* Educational qualifications - Modern style */
          .border-b {
            border-bottom: none !important;
            margin-bottom: 12px;
            padding-bottom: 0;
          }

          /* Semester marks - Modern header */
          .mt-8 h4 {
            font-size: 11pt;
            font-weight: 600;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            padding: 9px 12px;
            margin: 15px 0 10px 0;
            border-left: 5px solid #7c3aed;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 4px;
          }

          /* Document attached indicator */
          .document-link {
            display: none !important;
          }

          .document-attached::after {
            content: ' [✓ Document Attached]';
            font-weight: bold;
            color: #000000;
          }

          /* Images in documents section */
          .marksheet-img {
            max-width: 120px;
            height: auto;
            border: 2px solid #000000;
            margin-top: 5px;
            display: inline-block;
          }

          /* Remove card styling, use clean layout */
          .bg-gradient-to-br,
          .card {
            background: transparent !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            padding: 0 !important;
          }

          /* Clean section spacing */
          .card.section-container {
            margin-bottom: 15px !important;
          }

          /* Page break control */
          .section-container {
            page-break-inside: avoid;
          }

          h3, h4 {
            page-break-after: avoid;
          }

          /* Declaration section */
          .declaration-title {
            font-size: 14pt;
            font-weight: bold;
            color: #000000;
          }

          /* Additional spacing */
          p {
            margin: 5px 0;
            line-height: 1.5;
          }

          /* Address fields - special handling */
          .col-span-2 {
            display: table-row !important;
          }

          .col-span-2 > span {
            display: table-cell !important;
            border: 1px solid #666666;
            padding: 8px 10px;
          }

          .col-span-2 .field-label {
            font-weight: bold;
            width: 35%;
          }

          .col-span-2 .field-value {
            width: 65%;
          }

          /* Create actual HTML table structure for printing */
          .section-container .grid-cols-2 {
            display: block !important;
          }

          .section-container .grid-cols-2 > div {
            display: flex !important;
            border-bottom: 1px solid #666666;
            min-height: 40px;
          }

          .section-container .grid-cols-2 > div:last-child {
            border-bottom: none;
          }

          .section-container .grid-cols-2 > div > div {
            flex: 1 !important;
            padding: 10px 12px !important;
            border-right: 1px solid #666666;
            display: flex !important;
            align-items: center;
          }

          .section-container .grid-cols-2 > div > div:nth-child(odd) {
            flex: 0 0 48% !important;
            background: #fafafa;
          }

          .section-container .grid-cols-2 > div > div:nth-child(even) {
            flex: 0 0 52% !important;
          }

          .section-container .grid-cols-2 > div > div:last-child {
            border-right: none;
          }

          /* Ensure proper table structure for all grids */
          .section-container .space-y-4,
          .section-container .space-y-6,
          .section-container .space-y-8 {
            display: block !important;
            width: 100%;
          }

          /* Qualification items - Card-like but clean */
          .section-container > div > div.border-b {
            display: block !important;
            width: 100%;
            border: 2px solid #3b82f6 !important;
            border-radius: 8px !important;
            margin-bottom: 12px;
            padding: 0 !important;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .section-container .border-b .grid-cols-2 {
            border: none;
          }

          /* Qualification headers */
          .border-b > div:first-child {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
            color: #ffffff !important;
            padding: 10px 14px !important;
            font-weight: 600 !important;
            border-bottom: 2px solid #1e40af !important;
          }

          /* Override any inline styles */
          [style*="display: flex"],
          [style*="display:flex"] {
            display: table !important;
          }

          /* Professional spacing and typography */
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
          }

          /* Modern table styling */
          table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            page-break-inside: avoid;
            margin: 0;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          th, td {
            border-right: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
            padding: 8px 10px;
            text-align: left;
            font-size: 9pt;
            line-height: 1.5;
            vertical-align: middle;
          }

          th {
            font-weight: 600;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: #ffffff;
            padding: 9px 10px;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            border-bottom: 2px solid #1e40af;
            text-transform: uppercase;
            font-size: 9pt;
            letter-spacing: 0.3px;
          }

          th:last-child,
          td:last-child {
            border-right: none;
          }

          tr:last-child td {
            border-bottom: none;
          }

          td {
            word-wrap: break-word;
            word-break: break-word;
          }

          /* Zebra striping for better readability */
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          tbody tr:nth-child(odd) {
            background: #ffffff;
          }

          /* Ensure tables fit on page */
          table[style*="width: 100%"] {
            table-layout: fixed;
          }

          /* Remove any shadows or rounded corners */
          * {
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          /* Print footer - Modern gradient */
          .print-footer {
            margin-top: 25px;
            padding: 16px 20px;
            border-top: 4px solid #3b82f6;
            text-align: center;
            font-size: 9.5pt;
            color: #374151;
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .print-footer p {
            margin: 4px 0;
            line-height: 1.6;
          }

          .print-footer strong {
            color: #1e40af;
            font-weight: 600;
          }

          /* Print timestamp */
          .print-timestamp {
            text-align: right;
            font-size: 9pt;
            color: #6b7280;
            margin-top: 15px;
            font-style: italic;
          }

          /* Application ID header - Modern badge style */
          .application-id-header {
            text-align: center;
            font-size: 12pt;
            font-weight: 600;
            margin: 12px 0;
            padding: 12px 20px;
            border: 3px solid #3b82f6;
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            color: #1e40af;
            border-radius: 8px;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
          }

          /* Watermark style */
          .print-watermark {
            display: block !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120pt;
            color: rgba(0, 0, 0, 0.05);
            font-weight: bold;
            z-index: -1;
            white-space: nowrap;
            pointer-events: none;
          }

          /* Declaration box styling - Modern accent */
          .section-container p {
            margin: 8px 0;
            line-height: 1.8;
            color: #374151;
          }

          /* Declaration section enhancement */
          div[style*="border: 2px solid #000000"][style*="padding: 15px"] {
            border: 3px solid #3b82f6 !important;
            border-radius: 8px !important;
            background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%) !important;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1) !important;
          }

          /* Modern accent lines */
          .section-container::before {
            content: '';
            display: block;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
            margin-bottom: 8px;
            border-radius: 2px;
          }

          /* Numbered section styling - Modern highlights */
          table td[style*="background: #f0f0f0"] {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            padding: 8px 10px !important;
          }

          table td[style*="background: #fafafa"] {
            background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%) !important;
            color: #1e40af !important;
            font-weight: 600 !important;
          }

          /* Enhanced row borders */
          table[style*="border: 2px solid #000000"] {
            border: 2px solid #3b82f6 !important;
            border-radius: 8px !important;
          }

          /* Skill tags or badge-like elements */
          .field-value strong {
            color: #7c3aed;
            font-weight: 600;
          }

          /* Grid improvements for better table appearance */
          .section-container .grid {
            border: 2px solid #000000;
          }

          .section-container .grid > div:first-child {
            border-top: none;
          }

          .section-container .grid-cols-1 > div {
            border-bottom: 1px solid #666666;
          }

          .section-container .grid-cols-1 > div:last-child {
            border-bottom: none;
          }

          /* Two-column grid inside bordered sections */
          .border-b .grid-cols-2 {
            border: none !important;
          }

          .border-b .grid-cols-2 > div {
            border-bottom: 1px solid #cccccc;
          }

          .border-b .grid-cols-2 > div:last-child {
            border-bottom: none;
          }

          /* Semester marks section */
          .mt-6 {
            margin-top: 15px;
          }

          .mt-8 {
            margin-top: 20px;
          }

          .border-t {
            border-top: 2px solid #666666 !important;
            padding-top: 12px !important;
          }

          /* Professional document structure */
          .print-border {
            position: relative;
          }

          /* Page numbering (automatic) */
          @page {
            @bottom-right {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 9pt;
              color: #666666;
            }
          }
        }
      `}
    </style>
  );
};

export default PrintPreviewStyle;
