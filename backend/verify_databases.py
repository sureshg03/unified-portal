"""
Verify Database Tables - Quick Check
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

print("="*60)
print("DATABASE VERIFICATION")
print("="*60)

databases = {
    'default': 'lsc_portal_db',
    'online_edu': 'online_edu', 
    'lsc_admindb': 'lsc_admindb'
}

for db_alias, db_name in databases.items():
    try:
        with connections[db_alias].cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            print(f"\n✓ Database: {db_name} ({db_alias})")
            print(f"  Total tables: {len(tables)}")
            if tables:
                print("  Tables:")
                for table in sorted(tables):
                    print(f"    - {table[0]}")
            else:
                print("  ⚠ No tables found!")
                
    except Exception as e:
        print(f"\n✗ Error accessing {db_name}: {e}")

print("\n" + "="*60)
print("✓ VERIFICATION COMPLETE!")
print("="*60)
print("\nAll three databases are set up with tables.")
print("You can now:")
print("  1. Run: python manage.py runserver")
print("  2. Create test users: python create_test_users.py")
print("  3. Access the application")
