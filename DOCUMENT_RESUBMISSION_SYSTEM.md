# Document Resubmission System - Complete Guide

## 📋 Overview

This system allows LSC Admins to mark documents as invalid and automatically sends an email to students with a secure resubmission link. Students can then upload corrected documents, which will be reviewed by admins again.

---

## 🔄 Workflow

### **Step 1: Document Validation by LSC Admin**

1. LSC Admin reviews student application documents
2. Marks documents as "Valid" or "Invalid"
3. Clicks "Save Verification Details"
4. System automatically detects invalid documents

### **Step 2: Automatic Email Notification**

When documents are marked invalid:
- ✅ Email is automatically sent to student's registered email
- 📧 Email contains:
  - List of invalid documents
  - Secure resubmission link (valid for 30 days)
  - Clear instructions for resubmission
  - Contact information for support

### **Step 3: Student Resubmits Documents**

1. Student receives email and clicks resubmission link
2. Link format: `http://localhost:5173/resubmit-documents/{token}`
3. Token is verified for validity and expiration
4. Student uploads corrected documents
5. System saves resubmitted files with timestamp

### **Step 4: Admin Reviews Resubmitted Documents**

1. LSC Admin sees "Resubmitted Documents" section in yellow/orange highlight
2. Admin can:
   - View resubmitted documents
   - Approve resubmitted documents
   - Reject resubmitted documents
3. Student is notified of the decision

---

## 🛠️ Technical Implementation

### **Backend Components**

#### 1. Email Notification System (`send_invalid_document_email.py`)

**Functions:**
- `generate_resubmission_token()` - Creates secure SHA-256 token
- `save_resubmission_token()` - Stores token in database with 30-day expiry
- `send_invalid_document_notification()` - Sends email to student
- `verify_resubmission_token()` - Validates token and checks expiry
- `mark_resubmission_complete()` - Marks token as used after submission

**Database Table:** `document_resubmissions`
```sql
CREATE TABLE document_resubmissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    invalid_documents JSON NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    INDEX idx_token (token),
    INDEX idx_application (application_id),
    INDEX idx_status (status)
);
```

#### 2. API Endpoints (`admin_views.py`)

**New Endpoints:**

1. **POST** `/api/lsc-admin/send-invalid-document-email/`
   - Sends email notification to student
   - Parameters: `application_id`, `invalid_documents[]`, `verified_by`
   - Returns: `resubmission_link`, `token`

2. **GET** `/api/resubmit-documents/verify/{token}/`
   - Verifies if resubmission link is valid
   - Returns: Application details and invalid documents list

3. **POST** `/api/resubmit-documents/submit/{token}/`
   - Handles file uploads from student
   - Saves files to `media/resubmitted_documents/{application_id}/`
   - Updates `document_validation` JSON field

4. **GET** `/api/lsc-admin/pending-revalidations/`
   - Gets list of students with pending resubmitted documents
   - Useful for admin dashboard

---

### **Frontend Components**

#### 1. Document Resubmission Page (`DocumentResubmission.tsx`)

**Features:**
- Token verification on page load
- File upload with validation (PDF, JPG, PNG, max 5MB)
- Real-time upload status indicators
- Auto-submit all documents
- Success/error handling

**User Experience:**
- 🎨 Professional gradient design
- ⏰ Shows link expiration date
- 📋 Clear upload requirements
- ✅ Visual confirmation for uploaded files
- 📞 Help section with contact info

#### 2. Resubmission Success Page (`ResubmissionSuccess.tsx`)

**Features:**
- Success confirmation message
- Timeline of what happens next
- Contact information
- Return to homepage button

#### 3. Updated Student Application Details (`StudentApplicationDetails.tsx`)

**New Features:**

**a) Automatic Email Sending:**
```typescript
const checkAndSendInvalidDocumentEmail = async () => {
  const invalidDocs = Object.entries(docValidation)
    .filter(([_, isValid]) => isValid === false)
    .map(([docType, _]) => docType);

  if (invalidDocs.length > 0) {
    await axios.post('/api/lsc-admin/send-invalid-document-email/', {
      application_id: applicationId,
      invalid_documents: invalidDocs,
      verified_by: 'LSC Admin'
    });
  }
};
```

**b) Resubmitted Documents Display:**
- Shows in yellow/orange highlighted section
- Displays upload timestamp
- Status badges (Pending Review, Approved, Rejected)
- View, Approve, Reject buttons

**c) Print Preview Enhancement:**
- Added "Eligibility Verified By" field
- Shows verification date
- Included in professional print layout

---

## 📧 Email Template

**Subject:** `Document Resubmission Required - Application {application_id}`

**Body:**
```
Dear {student_name},

Your application ({application_id}) has been reviewed by {verified_by}.

Unfortunately, the following documents have been marked as INVALID and require resubmission:

  • SSLC Certificate
  • HSC Certificate
  (... etc)

Please resubmit the correct/original documents using the secure link below:

🔗 Resubmission Link: {resubmission_link}

⏰ This link is valid for 30 days from now.

IMPORTANT INSTRUCTIONS:
1. Click the link above to access the document resubmission portal
2. Upload clear, original copies of the invalid documents only
3. Ensure all documents are properly scanned/photographed
4. File formats accepted: PDF, JPG, PNG (Max 5MB per file)
5. After resubmission, your application will be reviewed within 2-3 business days

Contact Information:
📧 Email: cdoe@periyaruniversity.ac.in
📞 Phone: +91-427-2345766

Thank you for your cooperation.

Best regards,
Centre for Distance and Online Education (CDOE)
Periyar University
```

---

## 🔒 Security Features

1. **Token Security:**
   - SHA-256 hashed tokens
   - Unique per application
   - 30-day expiration
   - Single-use (marked complete after submission)

2. **File Upload Security:**
   - File type validation (PDF, JPG, PNG only)
   - File size limit (5MB per file)
   - Saved in secure directory structure
   - Timestamped filenames to prevent overwrite

3. **Database Security:**
   - Indexed for performance
   - JSON validation for document data
   - Status tracking (pending, completed)

---

## 📊 Data Flow

```
┌─────────────────┐
│  LSC Admin      │
│  Marks Invalid  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Verification│
│  + Auto Email   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Token  │
│ & Send Email    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Student Gets   │
│  Email w/ Link  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Student Clicks  │
│ Resubmit Link   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Token    │
│ Show Upload UI  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Student Uploads │
│ Documents       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB +    │
│ File System     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Reviews   │
│ Resubmitted Docs│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Approve/Reject  │
│ Final Decision  │
└─────────────────┘
```

---

## 🎯 Usage Instructions

### For LSC Admins:

1. **Mark Documents as Invalid:**
   - Open student application details
   - Review each document
   - Click "Invalid" button for incorrect documents
   - Click "Save Verification Details"
   - ✅ Email is automatically sent

2. **Review Resubmitted Documents:**
   - Look for yellow/orange "Resubmitted Documents" section
   - Click "View Resubmitted" to see the new document
   - Click "Approve" if document is now valid
   - Click "Reject" if still invalid
   - Student can be notified again if needed

3. **Track Pending Revalidations:**
   - Access `/api/lsc-admin/pending-revalidations/` endpoint
   - Shows all students with resubmitted documents pending review

### For Students:

1. **Receive Email Notification:**
   - Check email inbox for resubmission notice
   - Note the expiration date (30 days)

2. **Upload Documents:**
   - Click the link in email
   - Upload each requested document
   - Ensure files are clear and under 5MB
   - Submit all documents

3. **Wait for Review:**
   - Expect review within 2-3 business days
   - Check email for final decision

---

## ⚙️ Configuration

### Email Settings (Django settings.py):

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Or your email provider
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@example.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'noreply@periyaruniversity.ac.in'

# Frontend URL for resubmission links
FRONTEND_URL = 'http://localhost:5173'  # Change for production
```

### File Upload Settings:

```python
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
```

---

## 🐛 Troubleshooting

### Email Not Sending:
- Check EMAIL_HOST settings in Django
- Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
- Check if port 587 is open
- Enable "Less secure app access" for Gmail

### Token Expired:
- Tokens expire after 30 days
- Admin must mark documents invalid again
- New email with new link will be sent

### File Upload Failed:
- Check file size (must be < 5MB)
- Verify file format (PDF, JPG, PNG only)
- Ensure MEDIA_ROOT directory is writable
- Check disk space

### Resubmitted Documents Not Showing:
- Verify `document_validation` JSON field structure
- Check if resubmitted documents were properly saved
- Refresh the page
- Check browser console for errors

---

## 📈 Future Enhancements

1. **Email Notifications:**
   - Send approval/rejection emails to students
   - Add email templates for different scenarios

2. **Dashboard Widget:**
   - Show count of pending revalidations
   - Quick access to resubmission queue

3. **Bulk Operations:**
   - Approve/reject multiple documents at once
   - Bulk email notifications

4. **Document Comparison:**
   - Side-by-side view of original vs resubmitted
   - Highlight differences

5. **Analytics:**
   - Track resubmission success rates
   - Document rejection reasons
   - Average review time

---

## 📝 Database Schema

### api_application Table Updates:
```sql
ALTER TABLE api_application 
ADD COLUMN document_validation JSON,
ADD COLUMN verified_date DATETIME,
ADD COLUMN verified_by VARCHAR(255);
```

### document_resubmissions Table:
```sql
-- Automatically created by send_invalid_document_email.py
-- when first email is sent
```

---

## ✅ Testing Checklist

- [ ] Mark documents as invalid and verify email is sent
- [ ] Check email contains correct resubmission link
- [ ] Click link and verify token validation works
- [ ] Upload documents (test file size/type validation)
- [ ] Submit and verify files are saved
- [ ] Check resubmitted documents appear in admin UI
- [ ] Test approve/reject functionality
- [ ] Verify print preview shows "Verified By" field
- [ ] Test expired token handling
- [ ] Test already-used token handling

---

## 📞 Support

For issues or questions:
- Email: cdoe@periyaruniversity.ac.in
- Phone: +91-427-2345766
- Office Hours: Monday-Friday, 9:00 AM - 5:00 PM

---

## 🎉 Summary

This complete document resubmission system provides:
- ✅ Automatic email notifications
- ✅ Secure token-based resubmission links
- ✅ User-friendly upload interface
- ✅ Admin review workflow
- ✅ Status tracking and updates
- ✅ Professional email templates
- ✅ Enhanced print preview with verification details

The system streamlines the document verification process, reduces manual work, and provides clear communication between admins and students.
