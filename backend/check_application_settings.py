#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from portal.models import ApplicationSettings
from django.db import connections

# Check if table exists and has data
print("\n" + "="*60)
print("APPLICATION SETTINGS CHECK")
print("="*60 + "\n")

try:
    # Get connection to lsc_admindb
    with connections['lsc_admindb'].cursor() as cursor:
        cursor.execute("SHOW TABLES LIKE 'portal_applicationsettings'")
        result = cursor.fetchone()
        if result:
            print("✓ Table 'portal_applicationsettings' EXISTS in lsc_admindb database")
            
            # Count records
            count = ApplicationSettings.objects.using('lsc_admindb').count()
            print(f"✓ Total records in table: {count}")
            
            if count > 0:
                print("\n" + "-"*60)
                print("EXISTING APPLICATION SETTINGS:")
                print("-"*60 + "\n")
                
                for setting in ApplicationSettings.objects.using('lsc_admindb').all():
                    status_emoji = "🟢" if (setting.is_open or setting.status == 'OPEN') else "🔴"
                    print(f"{status_emoji} {setting.admission_code} - {setting.admission_year}")
                    print(f"   Type: {setting.admission_type}")
                    print(f"   Status: {setting.status}")
                    print(f"   Is Open: {setting.is_open}")
                    print(f"   Is Active: {setting.is_active}")
                    print(f"   Opening: {setting.opening_date}")
                    print(f"   Closing: {setting.closing_date}")
                    print(f"   Applications: {setting.current_applications}/{setting.max_applications if setting.max_applications > 0 else '∞'}")
                    print()
            else:
                print("\n⚠ No application settings found!")
                print("\nTo create application settings:")
                print("1. Login as LSC Admin")
                print("2. Go to 'Admission Management' section")
                print("3. Create a new admission session")
        else:
            print("✗ Table 'portal_applicationsettings' DOES NOT EXIST")
            print("\nRun migrations to create the table:")
            print("python manage.py migrate portal --database=lsc_admindb")
            
except Exception as e:
    print(f"✗ Error checking table: {e}")
    print("\nMake sure:")
    print("1. MySQL server is running")
    print("2. lsc_admindb database exists")
    print("3. Credentials in settings.py are correct")

print("\n" + "="*60 + "\n")
