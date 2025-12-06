import os
import django
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import StudentDetails

print("\n" + "="*80)
print("CHECKING DOCUMENT URLs IN DATABASE")
print("="*80 + "\n")

students = StudentDetails.objects.all()

if not students:
    print("❌ No StudentDetails records found in database!")
else:
    for student in students:
        print(f"\n📧 Email: {student.email}")
        try:
            print(f"👤 User ID: {student.user_id if student.user_id else 'N/A'}")
        except:
            print(f"👤 User ID: N/A")
        print("-" * 80)
        
        # Check all document URLs
        documents = {
            'Photo': student.photo_url,
            'Signature': student.signature_url,
            'Community Certificate': student.community_certificate_url,
            'Aadhaar': student.aadhaar_url,
            'Transfer Certificate': student.transfer_certificate_url,
            'SSLC Marksheet': student.sslc_marksheet_url,
            'HSC Marksheet': student.hsc_marksheet_url,
            'UG Marksheet': student.ug_marksheet_url,
        }
        
        uploaded_docs = []
        missing_docs = []
        
        for doc_name, doc_url in documents.items():
            if doc_url:
                uploaded_docs.append(f"✅ {doc_name}: {doc_url}")
            else:
                missing_docs.append(f"❌ {doc_name}: NOT UPLOADED")
        
        if uploaded_docs:
            print("\n📁 UPLOADED DOCUMENTS:")
            for doc in uploaded_docs:
                print(f"  {doc}")
        
        if missing_docs:
            print("\n⚠️  MISSING DOCUMENTS:")
            for doc in missing_docs:
                print(f"  {doc}")
        
        print("-" * 80)

print("\n" + "="*80)
print("END OF REPORT")
print("="*80 + "\n")
