import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

print("Adding document validation fields to api_application table...")

try:
    with connections['default'].cursor() as cursor:
        # Add document_validation field
        try:
            cursor.execute("""
                ALTER TABLE api_application 
                ADD COLUMN document_validation JSON DEFAULT NULL
            """)
            print("✅ Added document_validation field")
        except Exception as e:
            if 'Duplicate column name' in str(e):
                print("⏭️  document_validation field already exists")
            else:
                print(f"❌ Error adding document_validation: {e}")
        
        # Add verified_date field
        try:
            cursor.execute("""
                ALTER TABLE api_application 
                ADD COLUMN verified_date DATETIME DEFAULT NULL
            """)
            print("✅ Added verified_date field")
        except Exception as e:
            if 'Duplicate column name' in str(e):
                print("⏭️  verified_date field already exists")
            else:
                print(f"❌ Error adding verified_date: {e}")
        
        # Add verified_by field
        try:
            cursor.execute("""
                ALTER TABLE api_application 
                ADD COLUMN verified_by VARCHAR(255) DEFAULT NULL
            """)
            print("✅ Added verified_by field")
        except Exception as e:
            if 'Duplicate column name' in str(e):
                print("⏭️  verified_by field already exists")
            else:
                print(f"❌ Error adding verified_by: {e}")
    
    print("\n✅ All fields added successfully!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
