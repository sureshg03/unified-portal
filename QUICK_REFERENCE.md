# 🚀 Quick Reference Card - Document Resubmission System

## ⚡ Quick Start (3 Steps)

### 1️⃣ Configure Email (One-Time Setup)
```python
# backend/backend/settings.py - Add these lines:
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'  # Your Gmail
EMAIL_HOST_PASSWORD = 'app-specific-password'  # From Google App Passwords
DEFAULT_FROM_EMAIL = 'noreply@periyaruniversity.ac.in'
FRONTEND_URL = 'http://localhost:5173'
```

### 2️⃣ Start Servers
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 3️⃣ Use the System
- Mark documents as "Invalid" → Save → **Email sent automatically!** ✅

---

## 📋 Admin Quick Actions

| Action | Steps | Result |
|--------|-------|--------|
| **Send Invalid Doc Email** | 1. Mark docs "Invalid"<br>2. Click "Save" | ✉️ Auto email sent |
| **Review Resubmitted** | 1. See yellow section<br>2. Click "View"<br>3. Approve/Reject | ✅ Status updated |
| **Print with Verification** | Click "Print Application" | 📄 Shows "Verified By" |

---

## 🔗 Important URLs

| Purpose | URL |
|---------|-----|
| Admin Dashboard | `http://localhost:5173/lsc/admin` |
| Student Resubmit | `http://localhost:5173/resubmit-documents/{token}` |
| API - Send Email | `POST /api/lsc-admin/send-invalid-document-email/` |
| API - Verify Token | `GET /api/resubmit-documents/verify/{token}/` |
| API - Submit Docs | `POST /api/resubmit-documents/submit/{token}/` |

---

## 🎨 UI Visual Guide

### Invalid Document Email Trigger
```
┌────────────────────────────────┐
│  Document Validation           │
│  ┌──────────────────────────┐  │
│  │ 📋 SSLC Certificate      │  │
│  │  [View] [Valid] [Invalid]│ ← Click "Invalid"
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 📜 HSC Certificate       │  │
│  │  [View] [Valid] [Invalid]│ ← Click "Invalid"
│  └──────────────────────────┘  │
└────────────────────────────────┘
        ↓
[Save Verification Details] ← Click
        ↓
📧 Email sent automatically!
```

### Resubmitted Documents Section
```
┌────────────────────────────────────────┐
│ 🔄 Resubmitted Documents               │ ← Yellow/Orange BG
│ (Student has uploaded new documents)   │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📄 SSLC                            │ │
│ │ Resubmitted: 12/11/2025 10:30 AM  │ │
│ │ ⏳ Pending Review                  │ │
│ │                                    │ │
│ │ [View Resubmitted] [Approve] [Reject]│
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Token Security | SHA-256 hashed, unique per application |
| Expiration | 30 days automatic expiry |
| Single Use | Marked complete after submission |
| File Validation | Type check (PDF/JPG/PNG), Size limit (5MB) |
| Directory Security | Timestamped filenames, isolated folders |

---

## 📧 Email Preview (What Students See)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 SUBJECT:
Document Resubmission Required - Application PU/ODL/LC2101/A25/0001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear John Doe,

Your documents have been reviewed. The following need resubmission:

  • SSLC Certificate
  • HSC Certificate

🔗 Resubmission Link:
http://localhost:5173/resubmit-documents/abc123def456...

⏰ Valid for 30 days

Instructions:
1. Click link above
2. Upload clear documents
3. Max 5MB per file (PDF/JPG/PNG)
4. Review in 2-3 business days

📞 Support: +91-427-2345766
📧 Email: cdoe@periyaruniversity.ac.in

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🐛 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Email not sending | Check `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` in settings |
| Link expired | Admin must mark invalid again (generates new link) |
| Upload fails | Check file size < 5MB, format PDF/JPG/PNG |
| Resubmit not showing | Refresh page, check browser console |

---

## 📊 Data Flow (1 Minute Overview)

```
ADMIN MARKS INVALID
        ↓
  SAVES VERIFICATION
        ↓
   AUTO SENDS EMAIL ← checkAndSendInvalidDocumentEmail()
        ↓
STUDENT GETS EMAIL (with secure link)
        ↓
 STUDENT CLICKS LINK
        ↓
TOKEN VERIFIED ← verify_resubmission_token()
        ↓
STUDENT UPLOADS DOCS
        ↓
  FILES SAVED ← submit_resubmitted_documents()
        ↓
ADMIN SEES YELLOW SECTION "Resubmitted Documents"
        ↓
ADMIN CLICKS APPROVE/REJECT
        ↓
    STATUS UPDATED
```

---

## 🎯 Key Functions Reference

### Backend (`admin_views.py`)
```python
send_invalid_document_email(request)  # Sends email
verify_resubmission_link(request, token)  # Validates token
submit_resubmitted_documents(request, token)  # Handles upload
get_pending_revalidations(request)  # Gets pending list
```

### Backend (`send_invalid_document_email.py`)
```python
generate_resubmission_token(app_id)  # Creates secure token
save_resubmission_token(app_id, token, docs)  # Saves to DB
send_invalid_document_notification(app_id, docs, by)  # Sends email
verify_resubmission_token(token)  # Checks validity
```

### Frontend (`StudentApplicationDetails.tsx`)
```typescript
checkAndSendInvalidDocumentEmail()  # Auto email on save
handleSaveVerification()  # Save + email trigger
```

---

## 📁 Key Files (Where to Look)

| File | Purpose |
|------|---------|
| `backend/api/send_invalid_document_email.py` | Email system logic |
| `backend/api/admin_views.py` | API endpoints (lines 1076-1380) |
| `frontend/src/components/modules/DocumentResubmission.tsx` | Student upload page |
| `frontend/src/components/modules/StudentApplicationDetails.tsx` | Admin review UI |

---

## ✅ Feature Checklist

- [x] Auto email on invalid documents
- [x] Secure token generation (30-day expiry)
- [x] Professional resubmission portal
- [x] File upload with validation
- [x] Admin review with approve/reject
- [x] Status tracking (Pending/Approved/Rejected)
- [x] Enhanced print with "Verified By"
- [x] Mobile responsive design
- [x] Error handling & validation
- [x] Success confirmation page

---

## 🔥 Pro Tips

1. **Test with Console Backend First:**
   ```python
   EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
   # Emails print to terminal - perfect for testing!
   ```

2. **Check Logs:**
   - Backend terminal shows email sending status
   - Browser console shows API calls
   - Network tab shows request/response

3. **Quick Debug:**
   ```bash
   # Check Django
   cd backend
   python manage.py check
   
   # Test email
   python manage.py shell
   >>> from django.core.mail import send_mail
   >>> send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])
   ```

4. **Production Deployment:**
   - Change `FRONTEND_URL` to production domain
   - Use environment variables for secrets
   - Set up proper email server (not Gmail)
   - Enable HTTPS for security

---

## 📞 Need Help?

| Resource | Location |
|----------|----------|
| Full Documentation | `DOCUMENT_RESUBMISSION_SYSTEM.md` |
| Email Setup | `EMAIL_SETUP_GUIDE.md` |
| Implementation Details | `IMPLEMENTATION_SUMMARY.md` |
| This Quick Card | `QUICK_REFERENCE.md` |

---

## 🎉 System Status: ✅ READY!

**All features implemented and tested!**

Just configure email and start using! 🚀

---

_Last Updated: November 12, 2025_  
_Version: 1.0_
