import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#1f2937',
    paddingBottom: 10,
  },
  universityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 5,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    width: 120,
  },
  value: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  footer: {
    marginTop: 30,
    borderTop: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 15,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    color: '#f3f4f6',
    opacity: 0.3,
    zIndex: -1,
  },
});

// PDF Receipt Component
const ReceiptPDF = ({ paymentData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.watermark}>PAID</Text>

      <View style={styles.header}>
        <Text style={styles.universityName}>Periyar University</Text>
        <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          Salem - 636 011, Tamil Nadu, India
        </Text>
      </View>

      <Text style={styles.receiptTitle}>FEE PAYMENT RECEIPT</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Receipt No:</Text>
          <Text style={styles.value}>{paymentData.receiptNumber}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date & Time:</Text>
          <Text style={styles.value}>{paymentData.date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Transaction ID:</Text>
          <Text style={styles.value}>{paymentData.transactionId}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>{paymentData.paymentMethod}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Information</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Student Name:</Text>
          <Text style={styles.value}>{paymentData.studentName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Application ID:</Text>
          <Text style={styles.value}>{paymentData.applicationId}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{paymentData.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Semester:</Text>
          <Text style={styles.value}>{paymentData.semester}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Fee Description:</Text>
          <Text style={styles.value}>{paymentData.description}</Text>
        </View>

        <View style={[styles.row, { borderTop: 1, borderTopColor: '#d1d5db', paddingTop: 8, marginTop: 8 }]}>
          <Text style={[styles.label, styles.amount]}>Total Amount:</Text>
          <Text style={styles.amount}>₹{paymentData.amount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Status</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, { color: '#059669', fontWeight: 'bold' }]}>PAID</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment Date:</Text>
          <Text style={styles.value}>{paymentData.paymentDate}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This is a computer-generated receipt and does not require a signature.
        </Text>
        <Text style={[styles.footerText, { marginTop: 5 }]}>
          For any queries, contact: accounts@periyaruniversity.ac.in | +91-427-2345766
        </Text>
        <Text style={[styles.footerText, { marginTop: 5, fontSize: 8 }]}>
          Generated on {new Date().toLocaleString()}
        </Text>
      </View>
    </Page>
  </Document>
);

// Receipt Download Component
const ReceiptDownload = ({ paymentData, fileName }) => (
  <PDFDownloadLink
    document={<ReceiptPDF paymentData={paymentData} />}
    fileName={fileName}
    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
  >
    {({ loading }) => (
      <>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {loading ? 'Generating...' : 'Download Receipt'}
      </>
    )}
  </PDFDownloadLink>
);

export default ReceiptDownload;