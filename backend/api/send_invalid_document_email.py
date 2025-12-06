"""
Email notification system for invalid document submissions
Sends email to students with resubmission link when documents are marked invalid
"""
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.db import connections

def generate_resubmission_token(application_id):
    """Generate a secure token for document resubmission"""
    # Create a secure random token
    random_token = secrets.token_urlsafe(32)
    # Combine with application ID and timestamp for uniqueness
    token_string = f"{application_id}_{random_token}_{datetime.now().timestamp()}"
    # Create hash
    token_hash = hashlib.sha256(token_string.encode()).hexdigest()
    return token_hash

def save_resubmission_token(application_id, token, invalid_documents):
    """Save the resubmission token to database"""
    cursor = connections['default'].cursor()
    
    # Check if table exists, create if not
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_resubmissions (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)
    
    # Token expires in 30 days
    expires_at = datetime.now() + timedelta(days=30)
    
    # Insert token record
    cursor.execute("""
        INSERT INTO document_resubmissions 
        (application_id, token, invalid_documents, expires_at)
        VALUES (%s, %s, %s, %s)
    """, [application_id, token, invalid_documents, expires_at])
    
    connections['default'].commit()
    cursor.close()
    
    return token

def get_student_email(application_id):
    """Get student email from application"""
    cursor = connections['default'].cursor()
    cursor.execute("""
        SELECT email, name_as_aadhaar 
        FROM api_application 
        WHERE application_id = %s
    """, [application_id])
    
    result = cursor.fetchone()
    cursor.close()
    
    if result:
        return result[0], result[1]
    return None, None

def send_invalid_document_notification(application_id, invalid_documents, verified_by):
    """
    Send email notification to student about invalid documents
    
    Args:
        application_id: Student's application ID
        invalid_documents: List of invalid document types
        verified_by: Name of person who verified documents
    
    Returns:
        dict: Status and message
    """
    try:
        # Get student email
        student_email, student_name = get_student_email(application_id)
        
        if not student_email:
            return {
                'status': 'error',
                'message': 'Student email not found'
            }
        
        # Generate resubmission token
        token = generate_resubmission_token(application_id)
        
        # Save token to database
        import json
        save_resubmission_token(application_id, token, json.dumps(invalid_documents))
        
        # Create resubmission link
        # In production, use your actual domain
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:8080')
        resubmission_link = f"{frontend_url}/resubmit-documents/{token}"
        
        # Format invalid documents list
        doc_names = {
            'sslc': 'SSLC Certificate',
            'hsc': 'HSC Certificate',
            'degree': 'Degree Certificate',
            'aadhaar': 'Aadhaar Card',
            'transfer': 'Transfer Certificate'
        }
        
        invalid_doc_list = '\n'.join([
            f"  • {doc_names.get(doc, doc.upper())}" 
            for doc in invalid_documents
        ])
        
        # Email subject
        subject = f'Document Resubmission Required - Application {application_id}'
        
        # Email body
        message = f"""
Dear {student_name or 'Student'},

Your application ({application_id}) has been reviewed by {verified_by}.

Unfortunately, the following documents have been marked as INVALID and require resubmission:

{invalid_doc_list}

Please resubmit the correct/original documents using the secure link below:

🔗 Resubmission Link: {resubmission_link}

⏰ This link is valid for 30 days from now.

IMPORTANT INSTRUCTIONS:
1. Click the link above to access the document resubmission portal
2. Upload clear, original copies of the invalid documents only
3. Ensure all documents are properly scanned/photographed
4. File formats accepted: PDF, JPG, PNG (Max 5MB per file)
5. After resubmission, your application will be reviewed again within 2-3 business days

If you have any questions or face issues uploading documents, please contact:

📧 Email: cdoe@periyaruniversity.ac.in
📞 Phone: +91-427-2345766

Thank you for your cooperation.

Best regards,
Centre for Distance and Online Education (CDOE)
Periyar University
Salem - 636 011, Tamil Nadu

---
This is an automated email. Please do not reply to this email.
If you did not apply for this programme, please ignore this email.
        """
        
        # Send email
        # Note: Configure EMAIL_BACKEND, EMAIL_HOST, EMAIL_PORT in settings.py
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@periyaruniversity.ac.in'),
            recipient_list=[student_email],
            fail_silently=False,
        )
        
        return {
            'status': 'success',
            'message': f'Email sent to {student_email}',
            'resubmission_link': resubmission_link,
            'token': token
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def verify_resubmission_token(token):
    """Verify if resubmission token is valid"""
    cursor = connections['default'].cursor()
    
    cursor.execute("""
        SELECT application_id, invalid_documents, status, expires_at
        FROM document_resubmissions
        WHERE token = %s
    """, [token])
    
    result = cursor.fetchone()
    cursor.close()
    
    if not result:
        return None, 'Invalid token'
    
    application_id, invalid_docs, status, expires_at = result
    
    # Check if expired
    if datetime.now() > expires_at:
        return None, 'Token expired'
    
    # Check if already used
    if status == 'completed':
        return None, 'Token already used'
    
    import json
    return {
        'application_id': application_id,
        'invalid_documents': json.loads(invalid_docs),
        'expires_at': expires_at
    }, None

def mark_resubmission_complete(token):
    """Mark resubmission as completed"""
    cursor = connections['default'].cursor()
    
    cursor.execute("""
        UPDATE document_resubmissions
        SET status = 'completed', used_at = NOW()
        WHERE token = %s
    """, [token])
    
    connections['default'].commit()
    cursor.close()
