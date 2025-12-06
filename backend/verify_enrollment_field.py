import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

def verify_enrollment_field():
    """Verify enrollment_no field exists in api_application table"""
    try:
        with connections['default'].cursor() as cursor:
            print("Checking api_application table structure...")
            
            cursor.execute("""
                DESCRIBE api_application
            """)
            
            columns = cursor.fetchall()
            
            print("\nAll columns in api_application:")
            print("-" * 60)
            enrollment_exists = False
            for col in columns:
                print(f"  {col[0]:<30} {col[1]:<20}")
                if col[0] == 'enrollment_no':
                    enrollment_exists = True
            
            print("-" * 60)
            if enrollment_exists:
                print("\n✅ enrollment_no field EXISTS")
            else:
                print("\n❌ enrollment_no field NOT FOUND")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    verify_enrollment_field()
