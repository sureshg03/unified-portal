# Email Configuration Guide for Document Resubmission System

## Quick Setup for Gmail

1. **Update Django settings.py:**

Add these lines to your `backend/backend/settings.py`:

```python
# Email Configuration for Invalid Document Notifications
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'  # Replace with your Gmail
EMAIL_HOST_PASSWORD = 'your-app-specific-password'  # Use App Password, not regular password
DEFAULT_FROM_EMAIL = 'noreply@periyaruniversity.ac.in'

# Frontend URL for resubmission links
FRONTEND_URL = 'http://localhost:5173'  # Change to production URL when deploying
```

---

## How to Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security**
3. Under "Signing in to Google," select **2-Step Verification** (enable if not already)
4. At the bottom, select **App passwords**
5. Select app: **Mail**
6. Select device: **Other (Custom name)** → Enter "Django CDOE"
7. Click **Generate**
8. Copy the 16-character password
9. Use this password in `EMAIL_HOST_PASSWORD`

---

## Testing Email Configuration

Run this Python script to test email:

```python
cd backend
python manage.py shell

# In Django shell:
from django.core.mail import send_mail

send_mail(
    'Test Email - CDOE',
    'This is a test email from the document resubmission system.',
    'noreply@periyaruniversity.ac.in',
    ['test-recipient@example.com'],  # Your test email
    fail_silently=False,
)
```

If successful, you'll see: `1` (indicating 1 email sent)

---

## For Production (Using University Mail Server)

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.periyaruniversity.ac.in'  # University SMTP server
EMAIL_PORT = 587  # or 465 for SSL
EMAIL_USE_TLS = True  # or EMAIL_USE_SSL = True for port 465
EMAIL_HOST_USER = 'cdoe@periyaruniversity.ac.in'
EMAIL_HOST_PASSWORD = 'your-password'
DEFAULT_FROM_EMAIL = 'cdoe@periyaruniversity.ac.in'

# Frontend URL
FRONTEND_URL = 'https://cdoe.periyaruniversity.ac.in'  # Production domain
```

---

## Development Mode (Console Backend)

For testing without actually sending emails:

```python
# Email Configuration - Development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
# Emails will be printed to console instead of being sent
```

---

## Environment Variables (Recommended for Security)

Create a `.env` file in backend directory:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@periyaruniversity.ac.in
FRONTEND_URL=http://localhost:5173
```

Then in settings.py:

```python
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
```

Install python-dotenv:
```bash
pip install python-dotenv
```

---

## Troubleshooting

### "SMTPAuthenticationError: Username and Password not accepted"
- Use App Password, not regular Gmail password
- Enable 2-Step Verification first
- Check if "Less secure app access" is needed (older accounts)

### "SMTPServerDisconnected: Connection unexpectedly closed"
- Check firewall settings
- Verify EMAIL_PORT (587 for TLS, 465 for SSL)
- Try EMAIL_USE_SSL instead of EMAIL_USE_TLS

### Emails going to Spam
- Set proper DEFAULT_FROM_EMAIL
- Add SPF and DKIM records to domain DNS
- Use university email server for production

### "ConnectionRefusedError: [Errno 111] Connection refused"
- EMAIL_HOST is incorrect
- Port is blocked by firewall
- SMTP server is not running

---

## Test the Complete Flow

1. **Configure email settings** (as above)
2. **Restart Django server:**
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test the flow:**
   - Go to LSC Admin portal
   - Open a student application
   - Mark documents as "Invalid"
   - Click "Save Verification Details"
   - Check console/inbox for email
   - Click resubmission link in email
   - Upload documents
   - Verify resubmitted docs appear in admin UI

---

## Production Checklist

- [ ] Configure production email server
- [ ] Set FRONTEND_URL to production domain
- [ ] Use environment variables for sensitive data
- [ ] Test email delivery
- [ ] Verify resubmission links work with production URL
- [ ] Check email templates render correctly
- [ ] Test token expiration (30 days)
- [ ] Monitor email sending logs
- [ ] Set up email failure alerts

---

## Email Template Customization

To customize email content, edit:
`backend/api/send_invalid_document_email.py`

Look for the `message` variable in `send_invalid_document_notification()` function.

You can modify:
- Subject line
- Email body text
- Formatting
- Contact information
- Instructions

---

## Monitoring Email Logs

Add logging to track email sending:

```python
import logging
logger = logging.getLogger(__name__)

# In send_invalid_document_notification():
logger.info(f"Sending invalid document email to {student_email} for application {application_id}")
logger.info(f"Invalid documents: {invalid_documents}")
logger.info(f"Resubmission link: {resubmission_link}")
```

---

## Ready to Use! 🚀

Once email is configured, the system will automatically:
1. ✅ Send emails when documents are marked invalid
2. ✅ Generate secure resubmission links
3. ✅ Track student uploads
4. ✅ Notify admins of pending reviews

No additional code needed - it's fully integrated!
