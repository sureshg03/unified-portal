import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

def add_enrollment_field():
    """Add enrollment_no field to api_application table in online_edu database"""
    try:
        with connections['online_edu'].cursor() as cursor:
            print("Adding enrollment_no field to api_application table in online_edu database...")
            
            # Add enrollment_no field
            try:
                cursor.execute("""
                    ALTER TABLE api_application 
                    ADD COLUMN enrollment_no VARCHAR(50) DEFAULT NULL
                """)
                print("✅ Added enrollment_no field")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print("ℹ️  enrollment_no field already exists")
                else:
                    raise e
            
            # Add index for faster lookups
            try:
                cursor.execute("""
                    CREATE INDEX idx_enrollment_no ON api_application(enrollment_no)
                """)
                print("✅ Added index on enrollment_no")
            except Exception as e:
                if "Duplicate key name" in str(e):
                    print("ℹ️  Index on enrollment_no already exists")
                else:
                    raise e
            
            print("\n✅ Enrollment field setup completed!")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    add_enrollment_field()
