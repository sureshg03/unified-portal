import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

# Add columns to api_student table in online_edu database
sql = """
ALTER TABLE api_student 
ADD COLUMN IF NOT EXISTS lsc_code VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS lsc_name VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS referral_date DATETIME NULL;
"""

try:
    with connections['online_edu'].cursor() as cursor:
        cursor.execute(sql)
        print("✅ Successfully added LSC columns to api_student table")
        print("   - lsc_code VARCHAR(50)")
        print("   - lsc_name VARCHAR(200)")
        print("   - referral_date DATETIME")
except Exception as e:
    print(f"❌ Error: {e}")
    
    # Try MySQL-style without IF NOT EXISTS
    try:
        with connections['online_edu'].cursor() as cursor:
            cursor.execute("ALTER TABLE api_student ADD COLUMN lsc_code VARCHAR(50) NULL;")
            print("✅ Added lsc_code column")
    except Exception as e2:
        print(f"   lsc_code: {e2}")
    
    try:
        with connections['online_edu'].cursor() as cursor:
            cursor.execute("ALTER TABLE api_student ADD COLUMN lsc_name VARCHAR(200) NULL;")
            print("✅ Added lsc_name column")
    except Exception as e3:
        print(f"   lsc_name: {e3}")
    
    try:
        with connections['online_edu'].cursor() as cursor:
            cursor.execute("ALTER TABLE api_student ADD COLUMN referral_date DATETIME NULL;")
            print("✅ Added referral_date column")
    except Exception as e4:
        print(f"   referral_date: {e4}")

print("\n✅ Done! You can now signup students with LSC tracking.")
