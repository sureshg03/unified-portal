"""
Create test users for LSC Portal authentication testing
"""
import os
import django
import sys

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from lsc_auth.models import LSCUser, LSCAdmin

User = get_user_model()

def create_test_users():
    """Create test admin and LSC user"""
    
    print("Creating test users...")
    
    # Create LSC User (in lsc_portal_db)
    try:
        lsc_user = LSCUser.objects.get(lsc_number='LSC001')
        print(f"✓ LSC user already exists: {lsc_user.lsc_number}")
    except LSCUser.DoesNotExist:
        lsc_user = LSCUser.objects.create_user(
            lsc_number='LSC001',
            password='lsc123',
            lsc_name='Test LSC Center',
            email='lsc001@test.com',
            mobile='9876543210',
            is_active=True
        )
        print(f"✓ Created LSC user: {lsc_user.lsc_number} / lsc123")
    
    # Create Admin in online_edu database
    try:
        admin = LSCAdmin.objects.using('online_edu').get(lsc_code='LC2101')
        print(f"✓ Admin already exists: {admin.lsc_code}")
    except LSCAdmin.DoesNotExist:
        from django.contrib.auth.hashers import make_password
        admin = LSCAdmin.objects.using('online_edu').create(
            lsc_code='LC2101',
            center_name='CDOE Main Admin',
            admin_email='admin@periyaruniversity.com',
            admin_password=make_password('admin123'),
            admin_name='System Administrator',
            mobile='1234567890',
            address='Periyar University Campus',
            district='Salem',
            state='Tamil Nadu',
            pincode='636011',
            is_active=True,
            created_by='system'
        )
        print(f"✓ Created admin: {admin.lsc_code} / admin123")
    
    # Create another LSC Center
    try:
        lsc_center = LSCAdmin.objects.using('online_edu').get(lsc_code='LSC2025')
        print(f"✓ LSC Center already exists: {lsc_center.lsc_code}")
    except LSCAdmin.DoesNotExist:
        from django.contrib.auth.hashers import make_password
        lsc_center = LSCAdmin.objects.using('online_edu').create(
            lsc_code='LSC2025',
            center_name='Test Learning Support Center',
            admin_email='lsc2025@test.com',
            admin_password=make_password('lsc123'),
            admin_name='LSC Administrator',
            mobile='9876543210',
            address='Test Address',
            district='Test District',
            state='Tamil Nadu',
            pincode='600001',
            is_active=True,
            created_by='system'
        )
        print(f"✓ Created LSC Center: {lsc_center.lsc_code} / lsc123")
    
    print("\n" + "="*50)
    print("TEST CREDENTIALS - LSC PORTAL")
    print("="*50)
    print("\nMain Admin Login (online_edu DB):")
    print("  LSC Number: LC2101")
    print("  Password: admin123")
    print("\nLSC Center Login (online_edu DB):")
    print("  LSC Number: LSC2025")
    print("  Password: lsc123")
    print("\nLSC User Login (lsc_portal_db):")
    print("  LSC Number: LSC001")
    print("  Password: lsc123")
    print("\n" + "="*50)
    
if __name__ == '__main__':
    create_test_users()
